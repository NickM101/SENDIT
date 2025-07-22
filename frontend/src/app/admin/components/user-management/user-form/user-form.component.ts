import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../auth/models/auth.models';
import { SharedModule } from '../../../../shared/shared.module';

declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: [],
  imports: [CommonModule, ReactiveFormsModule, SharedModule]
})
export class UserFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() user: User | null = null;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  userForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.user;
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    // Manually initialize Preline UI components for the modal
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }

  ngOnDestroy(): void {
    // No specific cleanup needed for this simple modal
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      name: [this.user?.name || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      phone: [this.user?.phone || '', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      role: [this.user?.role || 'USER'],
      isActive: [this.user?.isActive ?? true]
    });

    if (this.isEditMode) {
      this.userForm.get('email')?.disable(); // Prevent changing email in edit mode
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const userData = this.userForm.getRawValue(); // Use getRawValue to get disabled field values

    if (this.isEditMode && this.user) {
      this.userService.updateUser(this.user.id, userData).subscribe({
        next: () => {
          this.loading = false;
          this.formSubmitted.emit();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.error = 'Failed to update user.';
          this.loading = false;
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.loading = false;
          this.formSubmitted.emit();
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.error = 'Failed to create user.';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.formCancelled.emit();
  }
}
