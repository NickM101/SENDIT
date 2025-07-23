// src/app/dashboard/admin/users/user-create/user-create.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from '../../../../../shared/shared.module';
import { LoadingService } from '../../../../../core/services/loading.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { UserRole, CreateUserRequest } from '../../models/user.models';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  imports: [SharedModule]
})
export class UserCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  createUserForm!: FormGroup;
  isSubmitting = false;
  showPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  readonly userRoles = [
    {
      value: UserRole.USER,
      label: 'Regular User',
      description: 'Can send and receive parcels',
    },
    {
      value: UserRole.COURIER,
      label: 'Courier',
      description: 'Can deliver parcels and update delivery status',
    },
    {
      value: UserRole.ADMIN,
      label: 'Administrator',
      description: 'Full system access and management',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.createUserForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{10,}$/)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        role: [UserRole.USER, [Validators.required]],
        dateOfBirth: [''],
        isActive: [true],
        emailNotifications: [true],
        smsNotifications: [false],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('File size must be less than 5MB');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    // Reset file input
    const fileInput = document.getElementById(
      'avatar-upload'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.createUserForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingService.show();

      const formValue = this.createUserForm.value;
      const createUserData: CreateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        password: formValue.password,
        role: formValue.role,
        dateOfBirth: formValue.dateOfBirth || undefined,
        address: formValue.address || undefined,
        isActive: formValue.isActive,
        emailNotifications: formValue.emailNotifications,
        smsNotifications: formValue.smsNotifications,
      };

      this.userService
        .createUser(createUserData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.toastService.success('User created successfully');

            // Upload profile picture if selected
            if (this.selectedFile) {
              this.uploadProfilePicture(user.id);
            } else {
              this.navigateToUserList();
            }
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.toastService.error(
              error.error?.message || 'Failed to create user'
            );
            this.isSubmitting = false;
            this.loadingService.hide();
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private uploadProfilePicture(userId: string): void {
    if (!this.selectedFile) {
      this.navigateToUserList();
      return;
    }

    this.userService
      .uploadProfilePicture(userId, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.toastService.success('Profile picture uploaded successfully');
          }
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.toastService.warning(
            'User created but profile picture upload failed'
          );
        },
        complete: () => {
          this.navigateToUserList();
        },
      });
  }

  private navigateToUserList(): void {
    this.isSubmitting = false;
    this.loadingService.hide();
    this.router.navigate(['/dashboard/admin/users']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createUserForm.controls).forEach((key) => {
      const control = this.createUserForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (this.createUserForm.dirty) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        this.router.navigate(['/dashboard/admin/users']);
      }
    } else {
      this.router.navigate(['/dashboard/admin/users']);
    }
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.createUserForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      if (field.errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} must not exceed ${
          field.errors['maxlength'].requiredLength
        } characters`;
      if (field.errors['pattern']) {
        if (fieldName === 'phone') return 'Please enter a valid phone number';
        if (fieldName === 'password')
          return 'Password must contain uppercase, lowercase, number, and special character';
      }
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      role: 'Role',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
    };
    return labels[fieldName] || fieldName;
  }

  getRoleDescription(role: UserRole): string {
    const roleData = this.userRoles.find((r) => r.value === role);
    return roleData?.description || '';
  }
}
