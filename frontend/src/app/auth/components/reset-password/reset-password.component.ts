// File: src/app/auth/components/reset-password/reset-password.component.ts
// Reset password component for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  ResetPasswordRequest,
  PasswordRequirements,
} from '../../models/auth.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  isLoading = false;
  error = '';
  success = false;
  successMessage = '';
  token = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordRequirements: PasswordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  };
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.createResetPasswordForm();
  }

  ngOnInit(): void {
    this.error = '';
    this.success = false;

    // Get token from query parameters
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.error = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    this.setupPasswordValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create reactive form for reset password
   */
  private createResetPasswordForm(): FormGroup {
    return this.formBuilder.group(
      {
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  /**
   * Setup password validation tracking
   */
  private setupPasswordValidation(): void {
    this.resetPasswordForm
      .get('password')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((password) => {
        this.updatePasswordRequirements(password || '');
      });
  }

  /**
   * Update password requirements checklist
   */
  private updatePasswordRequirements(password: string): void {
    this.passwordRequirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }

  /**
   * Custom validator for password field
   */
  private passwordValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const errors: any = {};

    if (value.length < 8) {
      errors.minLength = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }
    if (!/\d/.test(value)) {
      errors.number = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.specialChar = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Custom validator for password confirmation
   */
  private passwordMatchValidator(
    group: AbstractControl
  ): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.token) {
      this.error = 'Invalid reset token. Please request a new password reset.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const resetPasswordData: ResetPasswordRequest = {
      token: this.token,
      password: this.resetPasswordForm.value.password,
      confirmPassword: this.resetPasswordForm.value.confirmPassword,
    };

    this.authService
      .resetPassword(resetPasswordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.success = true;
          this.successMessage =
            response.message || 'Password has been reset successfully.';
        },
        error: (error) => {
          this.isLoading = false;
          this.error =
            error.message || 'Failed to reset password. Please try again.';
        },
      });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to forgot password page
   */
  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach((key) => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.resetPasswordForm.controls;
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Check if form has specific error
   */
  hasFormError(errorType: string): boolean {
    return (
      this.resetPasswordForm.hasError(errorType) &&
      ((this.resetPasswordForm.get('confirmPassword')?.dirty ?? false) ||
        (this.resetPasswordForm.get('confirmPassword')?.touched ?? false))
    );
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    if (!field || !field.errors) return '';

    switch (fieldName) {
      case 'password':
        if (field.errors['required']) return 'Password is required';
        return 'Password must meet all requirements below';

      case 'confirmPassword':
        if (field.errors['required']) return 'Please confirm your password';
        break;
    }

    return 'Invalid input';
  }

  /**
   * Check if password requirements are met
   */
  get allPasswordRequirementsMet(): boolean {
    return Object.values(this.passwordRequirements).every(
      (req) => req === true
    );
  }
}
