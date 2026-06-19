// backend/src/services/AuthService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authConfig } from '../config/auth';
import { UserRepository } from '../repositories/UserRepository';
import { User, UserDTO, toUserDTO } from '../models/User';
import { pools } from '../config/database';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  clientId: number;
  processCodes?: string[] | null;
  branchCodes?: string[] | null;
  iat?: number;
  exp?: number;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDTO;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.accessTokenExpiry,
    });
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
    } catch (err) {
      return null;
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async storeRefreshToken(userId: number, token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pools.app.query(
      'INSERT INTO cm_refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
  }

  async verifyRefreshToken(token: string): Promise<number | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows]: any = await pools.app.query(
      'SELECT user_id FROM cm_refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (rows.length === 0) return null;
    return rows[0].user_id;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pools.app.query('DELETE FROM cm_refresh_tokens WHERE token_hash = ?', [tokenHash]);
  }

  async login(email: string, password: string): Promise<LoginResult | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) return null;

    await this.userRepo.updateLastLogin(user.id);

    const accessToken = this.generateAccessToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      processCodes: user.processCodes,
      branchCodes: user.branchCodes,
    });

    const refreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
      user: toUserDTO(user),
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const userId = await this.verifyRefreshToken(refreshToken);
    if (!userId) return null;

    const user = await this.userRepo.findById(userId);
    if (!user) return null;

    // Revoke old refresh token
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      processCodes: user.processCodes,
      branchCodes: user.branchCodes,
    });

    const newRefreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }
}
