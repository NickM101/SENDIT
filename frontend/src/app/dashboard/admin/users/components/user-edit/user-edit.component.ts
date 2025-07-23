// src/app/dashboard/admin/users/user-edit/user-edit.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from '../../../../../shared/shared.module';
import { LoadingService } from '../../../../../core/services/loading.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { User, UserRole, UpdateUserRequest } from '../../models/user.models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  imports: [SharedModule]
})
export class UserEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  editUserForm!: FormGroup;
  changePasswordForm!: FormGroup;
  userId: string = '';
  user: User | null = null;
  isLoading = false;
  isSubmitting = false;
  showPasswordSection = false;
  showPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null | undefined = null;

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
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    } else {
      this.router.navigate(['/dashboard/admin/users']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.editUserForm = this.fb.group({
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
      role: [UserRole.USER, [Validators.required]],
      dateOfBirth: [''],
      address: [''],
      isActive: [true],
      emailNotifications: [true],
      smsNotifications: [false],
    });

    this.changePasswordForm = this.fb.group(
      {
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

  loadUser(): void {
    this.isLoading = true;
    this.loadingService.show();

    this.userService
      .getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.populateForm(user);
          this.previewUrl = user.avatarUrl;
          this.isLoading = false;
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.toastService.error('Failed to load user details');
          this.isLoading = false;
          this.loadingService.hide();
          this.router.navigate(['/dashboard/admin/users']);
        },
      });
  }

  private populateForm(user: User): void {
    this.editUserForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '',
      address: user.address || '',
      isActive: user.isActive,
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
    });
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
    this.previewUrl = this.user?.avatarUrl || null;
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

  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.changePasswordForm.reset();
    }
  }

  onSubmit(): void {
    if (this.editUserForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingService.show();

      const formValue = this.editUserForm.value;
      const updateUserData: UpdateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        role: formValue.role,
        dateOfBirth: formValue.dateOfBirth || undefined,
        address: formValue.address || undefined,
        isActive: formValue.isActive,
        emailNotifications: formValue.emailNotifications,
        smsNotifications: formValue.smsNotifications,
      };

      // Add password if changing
      if (this.showPasswordSection && this.changePasswordForm.valid) {
        updateUserData.password = this.changePasswordForm.value.password;
      }

      this.userService
        .updateUserByAdmin(this.userId, updateUserData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.user = user;
            this.toastService.success('User updated successfully');

            // Upload profile picture if selected
            if (this.selectedFile) {
              this.uploadProfilePicture();
            } else {
              this.completeUpdate();
            }
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.toastService.error(
              error.error?.message || 'Failed to update user'
            );
            this.isSubmitting = false;
            this.loadingService.hide();
          },
        });
    } else {
      this.markFormGroupTouched();
      if (this.showPasswordSection) {
        this.markPasswordFormTouched();
      }
    }
  }

  private uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.completeUpdate();
      return;
    }

    this.userService
      .uploadProfilePicture(this.userId, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && this.user) {
            this.user.avatarUrl = response.data.avatarUrl;
            this.toastService.success('Profile picture updated successfully');
          }
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.toastService.warning(
            'User updated but profile picture upload failed'
          );
        },
        complete: () => {
          this.completeUpdate();
        },
      });
  }

  private completeUpdate(): void {
    this.isSubmitting = false;
    this.loadingService.hide();
    this.showPasswordSection = false;
    this.changePasswordForm.reset();
    this.selectedFile = null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editUserForm.controls).forEach((key) => {
      const control = this.editUserForm.get(key);
      control?.markAsTouched();
    });
  }

  private markPasswordFormTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach((key) => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (this.editUserForm.dirty || this.changePasswordForm.dirty) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        this.router.navigate(['/dashboard/admin/users', this.userId]);
      }
    } else {
      this.router.navigate(['/dashboard/admin/users', this.userId]);
    }
  }

  goToDetails(): void {
    this.router.navigate(['/dashboard/admin/users', this.userId]);
  }

  // Utility methods for template
  isFieldInvalid(
    formName: 'editUser' | 'changePassword',
    fieldName: string
  ): boolean {
    const form =
      formName === 'editUser' ? this.editUserForm : this.changePasswordForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(
    formName: 'editUser' | 'changePassword',
    fieldName: string
  ): string {
    const form =
      formName === 'editUser' ? this.editUserForm : this.changePasswordForm;
    const field = form.get(fieldName);
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
