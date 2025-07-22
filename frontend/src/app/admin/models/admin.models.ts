import { UserRole } from '../../auth/models/auth.models'; // Assuming Role enum is defined here

export interface UpdateUserByAdminDto {
  email?: string;
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  isActive?: boolean;
  avatarUrl?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  role?: UserRole;
  password?: string;
}
