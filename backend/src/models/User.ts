// backend/src/models/User.ts
import { Role, ProcessScope, BranchScope } from './types';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  employeeCode: string | null;
  fullName: string;
  role: Role;
  clientId: number;
  processCodes: ProcessScope;
  branchCodes: BranchScope;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  clientId: number;
  processCodes: ProcessScope;
  branchCodes: BranchScope;
  lastLoginAt: Date | null;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    clientId: user.clientId,
    processCodes: user.processCodes,
    branchCodes: user.branchCodes,
    lastLoginAt: user.lastLoginAt,
  };
}
