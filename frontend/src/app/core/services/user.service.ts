import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../auth/models/auth.models';

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  lastPage: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users'; // Adjust if your user API is different

  constructor(private http: HttpClient) { }

  getUsers(page: number, limit: number, filters?: any): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.append(key, filters[key].toString());
        }
      });
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/admin`, { params });
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/admin/stats`);
  }

  updateUser(userId: string, updateData: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/admin/${userId}`, updateData);
  }

  createUser(userData: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin`, userData);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/admin/${userId}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/${userId}`);
  }

  // You might want to add a method to get user's parcels if needed
  // getUserParcels(userId: string): Observable<Parcel[]> {
  //   return this.http.get<Parcel[]>(`${this.apiUrl}/${userId}/parcels`);
  // }
}
