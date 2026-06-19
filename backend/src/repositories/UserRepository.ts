// backend/src/repositories/UserRepository.ts
import { RowDataPacket } from 'mysql2/promise';
import { pools } from '../config/database';
import { User } from '../models/User';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        id, email, password_hash as passwordHash, employee_code as employeeCode,
        full_name as fullName, role, client_id as clientId,
        process_codes as processCodes, branch_codes as branchCodes,
        is_active as isActive, last_login_at as lastLoginAt,
        created_at as createdAt, updated_at as updatedAt
      FROM cm_users
      WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      employeeCode: row.employeeCode,
      fullName: row.fullName,
      role: row.role,
      clientId: row.clientId,
      processCodes: row.processCodes ? JSON.parse(row.processCodes) : null,
      branchCodes: row.branchCodes ? JSON.parse(row.branchCodes) : null,
      isActive: Boolean(row.isActive),
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await pools.app.query<RowDataPacket[]>(
      `SELECT
        id, email, password_hash as passwordHash, employee_code as employeeCode,
        full_name as fullName, role, client_id as clientId,
        process_codes as processCodes, branch_codes as branchCodes,
        is_active as isActive, last_login_at as lastLoginAt,
        created_at as createdAt, updated_at as updatedAt
      FROM cm_users
      WHERE id = ? AND is_active = TRUE`,
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      employeeCode: row.employeeCode,
      fullName: row.fullName,
      role: row.role,
      clientId: row.clientId,
      processCodes: row.processCodes ? JSON.parse(row.processCodes) : null,
      branchCodes: row.branchCodes ? JSON.parse(row.branchCodes) : null,
      isActive: Boolean(row.isActive),
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateLastLogin(userId: number): Promise<void> {
    await pools.app.query(
      'UPDATE cm_users SET last_login_at = NOW() WHERE id = ?',
      [userId]
    );
  }
}
