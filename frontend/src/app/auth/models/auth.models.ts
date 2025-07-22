export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  avatarUrl: string | null;
  emailVerified: boolean;
  access_token: string;
  dateOfBirth?: string;
  profilePicture?: string;
  address?: string;
  bio?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string | undefined;
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
  GUEST = 'GUEST',
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
