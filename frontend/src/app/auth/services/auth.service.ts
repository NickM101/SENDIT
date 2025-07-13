// File: src/app/auth/services/auth.service.ts
// Authentication service for SendIT application

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ApiResponse,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Initialize from localStorage
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');

    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  /**
   * Get current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current token value
   */
  public get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.tokenValue && !!this.currentUserValue;
  }

  /**
   * Check if user is admin
   */
  public get isAdmin(): boolean {
    return this.currentUserValue?.role === 'ADMIN';
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
            return response.data;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
            return response.data;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send forgot password email
   */
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
            return response.data;
          }
          throw new Error(response.message || 'Failed to send reset email');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reset password with token
   */
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
            return response.data;
          }
          throw new Error(response.message || 'Password reset failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify email with token
   */
  verifyEmail(
    verificationData: EmailVerificationRequest
  ): Observable<EmailVerificationResponse> {
    return this.http
      .post<ApiResponse<EmailVerificationResponse>>(
        `${this.apiUrl}/verify-email`,
        verificationData
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            if (response.data.user) {
              this.updateCurrentUser(response.data.user);
            }
            return response.data;
          }
          throw new Error(response.message || 'Email verification failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/resend-verification`, {})
      .pipe(
        map((response) => ({
          success: response.success,
          message: response.message,
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh token
   */
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
        catchError(this.handleError)
      );
  }

  /**
   * Set authentication data
   */
  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  /**
   * Update current user data
   */
  private updateCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Handle HTTP errors
   */
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

    return throwError(() => new Error(errorMessage));
  }
}
