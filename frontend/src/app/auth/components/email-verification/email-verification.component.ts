// File: src/app/auth/components/email-verification/email-verification.component.ts
// Email verification component for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EmailVerificationRequest } from '../../models/auth.models';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  isLoading = false;
  isResending = false;
  error = '';
  success = false;
  successMessage = '';
  token = '';
  userEmail = '';
  canResend = true;
  resendCountdown = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.error = '';
    this.success = false;

    // Get token from query parameters
    this.token = this.route.snapshot.queryParams['token'] || '';

    // Get user email from current user or localStorage
    const currentUser = this.authService.currentUserValue;
    this.userEmail =
      currentUser?.email || localStorage.getItem('verification_email') || '';

    // If token is provided, automatically verify
    if (this.token) {
      this.verifyEmail();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verify email with token
   */
  verifyEmail(): void {
    if (!this.token) {
      this.error =
        'Invalid verification link. Please request a new verification email.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const verificationData: EmailVerificationRequest = {
      token: this.token,
    };

    this.authService
      .verifyEmail(verificationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.success = true;
          this.successMessage =
            response.message || 'Email verified successfully!';

          // Auto-redirect to dashboard after 3 seconds
          timer(3000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.goToDashboard();
            });
        },
        error: (error) => {
          this.isLoading = false;
          this.error =
            error.message || 'Email verification failed. Please try again.';
        },
      });
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): void {
    if (!this.canResend || this.isResending) return;

    this.isResending = true;
    this.error = '';

    this.authService
      .resendVerificationEmail()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isResending = false;
          this.startResendCooldown();
          // Show success message temporarily
          this.showTempMessage(
            'Verification email sent! Please check your inbox.'
          );
        },
        error: (error) => {
          this.isResending = false;
          this.error =
            error.message ||
            'Failed to send verification email. Please try again.';
        },
      });
  }

  /**
   * Start cooldown timer for resend button
   */
  private startResendCooldown(): void {
    this.canResend = false;
    this.resendCountdown = 60; // 60 seconds cooldown

    timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resendCountdown--;
        if (this.resendCountdown <= 0) {
          this.canResend = true;
        }
      });
  }

  /**
   * Show temporary success message
   */
  private showTempMessage(message: string): void {
    const originalError = this.error;
    this.error = '';
    this.successMessage = message;

    timer(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.successMessage = '';
        this.error = originalError;
      });
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to register page
   */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Get masked email for display
   */
  get maskedEmail(): string {
    if (!this.userEmail) return '';

    const [username, domain] = this.userEmail.split('@');
    if (username.length <= 2) return this.userEmail;

    const maskedUsername =
      username.charAt(0) +
      '*'.repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }
}
