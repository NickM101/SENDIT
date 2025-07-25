// File: src/app/auth/components/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  returnUrl: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.loginForm.value.email.trim().toLowerCase(),
      password: this.loginForm.value.password,
    };

    this.authService
      .login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigation is handled in the AuthService after setting auth data
        },
        error: (error) => {
          this.isLoading = false;
          // Handle errors appropriately
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';
    const errors = field.errors;
    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      return `Password must be at least ${errors['minlength'].requiredLength} characters`;
    }
    return 'Invalid input';
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName) {
      case 'email':
        return 'Email address';
      case 'password':
        return 'Password';
      default:
        return fieldName;
    }
  }
}
