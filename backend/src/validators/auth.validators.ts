// backend/src/validators/auth.validators.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32, 'Invalid refresh token'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(32, 'Invalid refresh token'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
