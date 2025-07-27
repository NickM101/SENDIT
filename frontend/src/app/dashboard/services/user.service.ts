// src/app/dashboard/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { User } from '../../auth/models/auth.models';

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    return this.apiService.get<User>('/users/me');
  }

  /**
   * Update user profile
   */
  updateProfile(
    userId: string,
    profileData: UpdateProfileDto
  ): Observable<User> {
    return this.apiService.patch<User>('/users/profile', profileData);
  }

  /**
   * Change user password
   */
  changePassword(
    userId: string,
    passwordData: ChangePasswordDto
  ): Observable<void> {
    return this.apiService.patch<void>('/users/change-password', passwordData);
  }

  /**
   * Update profile picture
   */
  updateProfilePicture(userId: string, file: File): Observable<string> {
    return this.apiService
      .uploadFile<{ avatarUrl: string }>('/users/profile-picture', file, {
        id: userId,
      })
      .pipe(
        map((response) => {
          if (response.data?.avatarUrl) {
            return response.data.avatarUrl;
          }
          throw new Error('Invalid response format');
        })
      );
  }

  /**
   * Get user statistics (for admin dashboard)
   */
  getUserStats(): Observable<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
  }> {
    return this.apiService.get('/users/admin/stats');
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers(params?: {
    search?: string;
    page?: number;
    limit?: number;
    role?: string[];
    isActive?: boolean;
  }): Observable<{
    data: User[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    return this.apiService.get('/users/admin', params);
  }

  /**
   * Get user by ID (admin only)
   */
  getUserById(userId: string): Observable<User> {
    return this.apiService.get<User>(`/users/admin/${userId}`);
  }

  /**
   * Update user by admin
   */
  updateUserByAdmin(userId: string, userData: Partial<User>): Observable<User> {
    return this.apiService.patch<User>(`/users/admin/${userId}`, userData);
  }

  /**
   * Soft delete user (admin only)
   */
  softDeleteUser(userId: string): Observable<User> {
    return this.apiService.delete<User>(`/users/admin/soft-delete/${userId}`);
  }

  /**
   * Restore soft-deleted user (admin only)
   */
  restoreUser(userId: string): Observable<User> {
    return this.apiService.patch<User>(`/users/admin/restore/${userId}`, {});
  }

  /**
   * Hard delete user (admin only)
   */
  deleteUser(userId: string): Observable<User> {
    return this.apiService.delete<User>(`/users/admin/${userId}`);
  }
}
