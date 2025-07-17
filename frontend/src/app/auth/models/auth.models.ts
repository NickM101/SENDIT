// File: src/app/auth/models/auth.models.ts

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  message: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface RegisterResponse {
  user: User;
  token: string;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  message: string;
  success: boolean;
  user?: User;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: AuthError[];
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  PREMIUM_USER = 'PREMIUM_USER',
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
