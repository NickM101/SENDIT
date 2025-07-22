import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload';
import { User } from '../../../auth/models/auth.models';
import { AdminService } from '../../../admin/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.html',
  styleUrls: [],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ImageUploadComponent]
})
export class UserDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  isEditing = false;
  profileForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    public toastService: ToastService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.loadUserDetails(userId);
      }
    });

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: [''],
      dateOfBirth: [''],
      avatarUrl: ['']
    });
  }

  ngAfterViewInit(): void {
    // Initialize Preline UI components after the view has been initialized
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }

  ngOnDestroy(): void {
    // Perform any cleanup if necessary
  }

  loadUserDetails(userId: string): void {
    this.loading = true;
    this.adminService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address
        });
      },
      error: (err) => {
        console.error('Error loading user details:', err);
        this.error = 'Failed to load user details.';
        this.loading = false;
        this.toastService.error('Loading Failed', 'Failed to load user details.');
      }
    });
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.user) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updatedUser = { ...this.user, ...this.profileForm.value };

    this.adminService.updateUser(this.user.id, updatedUser).subscribe({
      next: (user) => {
        this.user = user;
        this.isEditing = false;
        this.toastService.success('Profile Updated', 'User profile updated successfully.');
      },
      error: (err) => {
        console.error('Error updating user profile:', err);
        this.toastService.error('Update Failed', 'Failed to update user profile.');
      }
    });
  }
}