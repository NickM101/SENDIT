// File: src/app/auth/components/register/register.component.ts
// Registration component for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  RegisterRequest,
  PasswordRequirements,
} from '../../models/auth.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  passwordRequirements: PasswordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  };
  isLoading = false;


  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    this.setupPasswordValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create reactive form for registration
   */
  private createRegisterForm(): FormGroup {
    return this.formBuilder.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            this.nameValidator,
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, this.phoneValidator]],
        dateOfBirth: ['', [this.ageValidator]],
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', [Validators.required]],
        agreeToTerms: [false, [Validators.requiredTrue]],
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
    this.registerForm
      .get('password')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((password) => {
        this.updatePasswordRequirements(password || '');
      });
  }

  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const today = new Date();
    const birthDate = new Date(control.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 18 ? null : { underage: true };
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
   * Custom validator for name field
   */
  private nameValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(value) ? null : { invalidName: true };
  }

  /**
   * Custom validator for phone field
   */
  private phoneValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
      ? null
      : { invalidPhone: true };
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
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
      const phoneData = this.registerForm.get('phone')?.value;

    const registerData: RegisterRequest = {
      name: this.registerForm.value.name.trim(),
      email: this.registerForm.value.email.trim().toLowerCase(),
      phone: this.registerForm.value.phone.trim(),
      dateOfBirth: this.registerForm.value.dateOfBirth,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      agreeToTerms: this.registerForm.value.agreeToTerms,
    };

    this.authService
      .register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Navigate to email verification or dashboard
          this.router.navigate(['/auth/verify-email']);
        },
        error: (error) => {
          // Errors are now handled by AuthService and NotificationService
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
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.registerForm.get(fieldName);
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
      this.registerForm.hasError(errorType) &&
      ((this.registerForm.get('confirmPassword')?.dirty ?? false) ||
        (this.registerForm.get('confirmPassword')?.touched ?? false))
    );
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    switch (fieldName) {
      case 'name':
        if (errors['required']) return 'Full name is required';
        if (errors['minlength']) return 'Name must be at least 2 characters';
        if (errors['maxlength']) return 'Name cannot exceed 50 characters';
        if (errors['invalidName'])
          return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        break;

      case 'email':
        if (errors['required']) return 'Email address is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;

      case 'phone':
        if (errors['required']) return 'Phone number is required';
        if (errors['invalidPhone']) return 'Please enter a valid phone number';
        break;

      case 'password':
        if (errors['required']) return 'Password is required';
        return 'Password must meet all requirements below';

      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        break;

      case 'agreeToTerms':
        if (errors['required'])
          return 'You must agree to the Terms of Service and Privacy Policy';
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
