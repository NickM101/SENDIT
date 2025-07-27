// src/app/dashboard/shared-features/profile/components/profile-page/profile-page.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../services/user.service';
import { User as UserModel } from '../../../auth/models/auth.models';

// Sub-components
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    SharedModule,
    ProfileHeaderComponent,
    ProfileFormComponent,
    PasswordChangeComponent,
    AccountSettingsComponent,
  ],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  currentUser: UserModel | null = null;
  isLoading = false;
  isDarkMode = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) {
    // Check for dark mode preference
    this.isDarkMode =
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser;
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
    }
  }

  handleAvatarChange(file: File): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.userService.updateProfilePicture(this.currentUser.id, file).subscribe({
      next: (avatarUrl) => {
        this.currentUser!.avatarUrl = avatarUrl;
        this.toastService.success('Profile picture updated successfully');
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to update profile picture');
        this.isLoading = false;
      },
    });
  }

  handleProfileUpdate(profileData: Partial<UserModel>): void {
    if (!this.currentUser) return;

    // Ensure dateOfBirth is Date or undefined (not null or string)
    let updateData: any = { ...profileData };
    if ('dateOfBirth' in updateData) {
      if (
        updateData.dateOfBirth === null ||
        updateData.dateOfBirth === undefined
      ) {
        updateData.dateOfBirth = undefined;
      } else if (typeof updateData.dateOfBirth === 'string') {
        const parsedDate = new Date(updateData.dateOfBirth);
        updateData.dateOfBirth = isNaN(parsedDate.getTime())
          ? undefined
          : parsedDate;
      }
    }

    this.isLoading = true;
    this.userService.updateProfile(this.currentUser.id, updateData).subscribe({
      next: (updatedUser) => {
        this.currentUser = { ...this.currentUser!, ...updatedUser };
        this.toastService.success('Profile updated successfully');
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to update profile');
        this.isLoading = false;
      },
    });
  }

  handlePasswordChange(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.userService
      .changePassword(this.currentUser.id, passwordData)
      .subscribe({
        next: () => {
          this.toastService.success('Password changed successfully');
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error('Failed to change password');
          this.isLoading = false;
        },
      });
  }

  handleSettingsUpdate(settings: any): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.userService.updateProfile(this.currentUser.id, settings).subscribe({
      next: (updatedUser) => {
        this.currentUser = { ...this.currentUser!, ...updatedUser };
        this.toastService.success('Settings updated successfully');
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to update settings');
        this.isLoading = false;
      },
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
