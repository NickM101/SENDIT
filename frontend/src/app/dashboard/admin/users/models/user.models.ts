// src/app/dashboard/admin/users/models/user.models.ts

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  dateOfBirth?: Date | null;
  address?: string | null;
  isActive: boolean;
  avatarUrl?: string | null;
  role: UserRole;
  deletedAt?: Date | null;
  welcomeEmailSent: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  COURIER = 'COURIER',
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phone: string;
  password: string;
  dateOfBirth?: Date;
  address?: string;
  role?: UserRole;
  isActive?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  phone?: string;
  password?: string;
  dateOfBirth?: Date;
  address?: string;
  role?: UserRole;
  isActive?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface UserQueryParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  courierUsers: number;
  regularUsers: number;
}

export interface UserTableAction {
  label: string;
  icon: string;
  action: (user: User) => void;
  class?: string;
  show?: (user: User) => boolean;
}
