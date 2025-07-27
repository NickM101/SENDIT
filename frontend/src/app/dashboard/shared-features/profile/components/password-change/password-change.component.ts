// src/app/dashboard/shared-features/profile/components/password-change/password-change.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
   
  `,
})
export class PasswordChangeComponent implements OnInit {
  @Input() isLoading = false;
  @Output() onPasswordChange = new EventEmitter<{
    oldPassword: string;
    newPassword: string;
  }>();

  passwordForm: FormGroup;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Password strength indicators
  hasMinLength = false;
  hasUpperLower = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(private fb: FormBuilder) {
    this.passwordForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to new password changes to update strength indicators
    this.passwordForm.get('newPassword')?.valueChanges.subscribe((password) => {
      this.updatePasswordStrength(password || '');
    });
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  private passwordStrengthValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const password = control.value;
    if (!password) return null;

    const hasMinLength = password.length >= 8;
    const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
    const hasNumber = /(?=.*\d)/.test(password);
    const hasSpecialChar = /(?=.*[@$!%*?&])/.test(password);

    const isValid =
      hasMinLength && hasUpperLower && hasNumber && hasSpecialChar;

    return isValid ? null : { pattern: true };
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;

    return newPassword.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  private updatePasswordStrength(password: string): void {
    this.hasMinLength = password.length >= 8;
    this.hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
    this.hasNumber = /(?=.*\d)/.test(password);
    this.hasSpecialChar = /(?=.*[@$!%*?&])/.test(password);
  }

  toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      const formValue = this.passwordForm.value;
      this.onPasswordChange.emit({
        oldPassword: formValue.oldPassword,
        newPassword: formValue.newPassword,
      });

      // Reset form after submission
      this.passwordForm.reset();
    }
  }
}
