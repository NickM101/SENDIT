// File: src/app/auth/components/forgot-password/forgot-password.component.ts
// Forgot password component for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ForgotPasswordRequest } from '../../models/auth.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  error = '';
  success = false;
  successMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.createForgotPasswordForm();
  }

  ngOnInit(): void {
    this.error = '';
    this.success = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create reactive form for forgot password
   */
  private createForgotPasswordForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = false;

    const forgotPasswordData: ForgotPasswordRequest = {
      email: this.forgotPasswordForm.value.email.trim().toLowerCase(),
    };

    this.authService
      .forgotPassword(forgotPasswordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.success = true;
          this.successMessage =
            response.message ||
            'Password reset link has been sent to your email address.';
        },
        error: (error) => {
          this.isLoading = false;
          this.error =
            error.message || 'Failed to send reset email. Please try again.';
        },
      });
  }

  /**
   * Navigate back to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Resend reset email
   */
  resendEmail(): void {
    if (this.forgotPasswordForm.valid) {
      this.success = false;
      this.onSubmit();
    }
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach((key) => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.forgotPasswordForm.controls;
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) {
      return 'Email address is required';
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    return 'Invalid input';
  }

  /**
   * Get email value from form
   */
  get emailValue(): string {
    return this.forgotPasswordForm.get('email')?.value || '';
  }
}
