// src/app/dashboard/admin/users/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  UserStats,
} from '../models/user.models';
import { PaginatedResponse } from '../../../../shared/models/api.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all users with optional filtering and pagination
   */
  getUsers(params?: UserQueryParams): Observable<PaginatedResponse<User>> {
    return this.apiService.getPaginated<User>('/users/admin', 'items', params);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`/users/admin/${id}`);
  }

  /**
   * Create new user (Admin only)
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    return this.apiService.post<User>('/users', userData);
  }

  /**
   * Update user by admin
   */
  updateUserByAdmin(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.apiService.patch<User>(`/users/admin/${id}`, userData);
  }

  /**
   * Soft delete user
   */
  softDeleteUser(id: string): Observable<User> {
    return this.apiService.delete<User>(`/users/admin/soft-delete/${id}`);
  }

  /**
   * Restore soft deleted user
   */
  restoreUser(id: string): Observable<User> {
    return this.apiService.patch<User>(`/users/admin/restore/${id}`, {});
  }

  /**
   * Hard delete user (permanent)
   */
  deleteUser(id: string): Observable<User> {
    return this.apiService.delete<User>(`/users/admin/${id}`);
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<UserStats> {
    return this.apiService.get<UserStats>('/users/admin/stats');
  }

  /**
   * Upload user profile picture
   */
  uploadProfilePicture(
    userId: string,
    file: File
  ): Observable<{ progress: number; data?: { avatarUrl: string } }> {
    return this.apiService.uploadFile<{ avatarUrl: string }>(
      '/users/profile-picture',
      file,
      { id: userId }
    );
  }
}
