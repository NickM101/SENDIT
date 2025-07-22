import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ApiResponse,
  UserRole,
} from '../models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../layouts/sidebar/sidebar.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
    private sidebarService: SidebarService
  ) {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    if (token && user) {
      this.tokenSubject.next(token);
      console.log('Current User:', user);
      const parsedUser = JSON.parse(user);
      this.currentUserSubject.next(parsedUser);
      this.sidebarService.setRole(parsedUser.role);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.tokenValue && !!this.currentUserValue;
  }

  public hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role || false;
  }

  public get isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  public get getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public get getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data?.access_token, response.data);
            this.toastService.success('Login successful');
            return response.data;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError((error) => this.handleError(error))
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
            this.toastService.success('Registration successful');
            return response.data;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError((error) => this.handleError(error))
      );
  }

  forgotPassword(
    email: ForgotPasswordRequest
  ): Observable<ForgotPasswordResponse> {
    return this.http
      .post<ApiResponse<ForgotPasswordResponse>>(
        `${this.apiUrl}/forgot-password`,
        email
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.toastService.success('Password reset email sent');
            return response.data;
          }
          throw new Error(response.message || 'Failed to send reset email');
        }),
        catchError((error) => this.handleError(error))
      );
  }

  resetPassword(
    resetData: ResetPasswordRequest
  ): Observable<ResetPasswordResponse> {
    return this.http
      .post<ApiResponse<ResetPasswordResponse>>(
        `${this.apiUrl}/reset-password`,
        resetData
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.toastService.success('Password reset successful');
            return response.data;
          }
          throw new Error(response.message || 'Password reset failed');
        }),
        catchError((error) => this.handleError(error))
      );
  }

  verifyEmail(
    verificationData: EmailVerificationRequest
  ): Observable<EmailVerificationResponse> {
    return this.http
      .post<ApiResponse<EmailVerificationResponse>>(
        `${this.apiUrl}/verify-email/${verificationData.token}`,
        {}
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            if (response.data.user) {
              this.updateCurrentUser(response.data.user);
            }
            this.toastService.success('Email verification successful');
            return response.data;
          }
          throw new Error(response.message || 'Email verification failed');
        }),
        catchError((error) => this.handleError(error))
      );
  }

  resendVerificationEmail(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/resend-verification`, {})
      .pipe(
        map((response) => {
          if (response.success) {
            this.toastService.success('Verification email resent');
          }
          return { success: response.success, message: response.message };
        }),
        catchError((error) => this.handleError(error))
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<{ token: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http
      .post<ApiResponse<{ token: string }>>(`${this.apiUrl}/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const newToken = response.data.token;
            localStorage.setItem('auth_token', newToken);
            this.tokenSubject.next(newToken);
          }
        }),
        map((response) => response.data!),
        catchError((error) => this.handleError(error))
      );
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
    this.sidebarService.setRole(user.role);

    // Navigate based on user role
    this.navigateByRole(user.role);
  }

  public navigateByRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/dashboard/admin']);
        break;
      case UserRole.USER:
      case UserRole.PREMIUM_USER:
        this.router.navigate(['/dashboard/user']);
        break;
      default:
        this.router.navigate(['/landing-page']);
        break;
    }
  }

  private updateCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 403) {
      errorMessage = 'Access denied';
    } else if (error.status === 404) {
      errorMessage = 'Service not found';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.log('Error Message:', errorMessage);

    this.toastService.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
