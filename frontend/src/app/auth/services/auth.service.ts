import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
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
  UserRole,
} from '../models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public isAuthenticated$: Observable<boolean>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastService: ToastService
  ) {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    if (token && user) {
      this.tokenSubject.next(token);
      const parsedUser = JSON.parse(user);
      this.currentUserSubject.next(parsedUser);
    }
    this.isAuthenticated$ = this.token$.pipe(map(token => !!token));
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
    return this.apiService.post<User>('/auth/login', credentials).pipe(
      tap((user) => {
        this.setAuthData(user.access_token, user);
        this.toastService.success('Login successful');
      }),
      map((user) => user)
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.apiService
      .post<RegisterResponse>('/auth/register', userData)
      .pipe(
        tap((response) => {
          this.setAuthData(response.token, response.user);
          this.toastService.success('Registration successful');
        }),
        map((response) => response)
      );
  }

  forgotPassword(
    email: ForgotPasswordRequest
  ): Observable<ForgotPasswordResponse> {
    return this.apiService
      .post<ForgotPasswordResponse>('/auth/forgot-password', email)
      .pipe(
        tap(() => {
          this.toastService.success('Password reset email sent');
        }),
        map((response) => response)
      );
  }

  resetPassword(
    resetData: ResetPasswordRequest
  ): Observable<ResetPasswordResponse> {
    return this.apiService
      .post<ResetPasswordResponse>('/auth/reset-password', resetData)
      .pipe(
        tap(() => {
          this.toastService.success('Password reset successful');
        }),
        map((response) => response)
      );
  }

  verifyEmail(
    verificationData: EmailVerificationRequest
  ): Observable<EmailVerificationResponse> {
    return this.apiService
      .post<EmailVerificationResponse>(
        `/auth/verify-email/${verificationData.token}`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.user) {
            this.updateCurrentUser(response.user);
          }
          this.toastService.success('Email verification successful');
        }),
        map((response) => response)
      );
  }

  resendVerificationEmail(): Observable<{ success: boolean; message: string }> {
    return this.apiService
      .post<{ success: boolean; message: string }>(
        '/auth/resend-verification',
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.toastService.success('Verification email resent');
          }
        }),
        map((response) => response)
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
    return this.apiService
      .post<{ token: string }>('/auth/refresh', {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          const newToken = response.token;
          localStorage.setItem('auth_token', newToken);
          this.tokenSubject.next(newToken);
        }),
        map((response) => response)
      );
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);

    // Use setTimeout to ensure navigation happens after state update
    setTimeout(() => {
      this.navigateByRole(user.role);
    }, 0);
  }

  public navigateByRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/dashboard/admin']);
        break;
      case UserRole.USER:
      case UserRole.COURIER:
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
}