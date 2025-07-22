import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PaginatedResponse, QueryParams } from '../../shared/models/api.model';
import { User } from '../../auth/models/auth.models'; // Assuming User model is here
import { UpdateUserByAdminDto } from '../models/admin.models'; // Will create this DTO

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminUsersEndpoint = '/users/admin';

  constructor(private apiService: ApiService) { }

  getUsers(params?: QueryParams): Observable<PaginatedResponse<User>> {
    return this.apiService.getPaginated<User>(this.adminUsersEndpoint, 'data', params);
  }

  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`${this.adminUsersEndpoint}/${id}`);
  }

  updateUser(id: string, userData: UpdateUserByAdminDto): Observable<User> {
    return this.apiService.patch<User>(`${this.adminUsersEndpoint}/${id}`, userData);
  }

  softDeleteUser(id: string): Observable<User> {
    return this.apiService.delete<User>(`${this.adminUsersEndpoint}/soft-delete/${id}`);
  }

  restoreUser(id: string): Observable<User> {
    return this.apiService.patch<User>(`${this.adminUsersEndpoint}/restore/${id}`);
  }

  hardDeleteUser(id: string): Observable<User> {
    return this.apiService.delete<User>(`${this.adminUsersEndpoint}/${id}`);
  }

  getUserStats(): Observable<any> {
    return this.apiService.get<any>(`${this.adminUsersEndpoint}/stats`);
  }
}
