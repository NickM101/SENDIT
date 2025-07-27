// src/app/dashboard/shared-features/profile/components/profile-header/profile-header.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { User as UserModel } from '../../../../../auth/models/auth.models';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './profile-header.component.html',
})
export class ProfileHeaderComponent {
  @Input() user: UserModel | null = null;
  @Input() isLoading = false;
  @Output() onAvatarChange = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'COURIER':
        return 'Courier';
      case 'PREMIUM_USER':
        return 'Premium User';
      case 'USER':
      default:
        return 'User';
    }
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusBgClass(): string {
    return this.user?.isActive
      ? 'bg-green-50 dark:bg-green-900/20'
      : 'bg-red-50 dark:bg-red-900/20';
  }

  getStatusDotClass(): string {
    return this.user?.isActive ? 'bg-green-400' : 'bg-red-400';
  }

  getStatusTextClass(): string {
    return this.user?.isActive
      ? 'text-green-800 dark:text-green-200'
      : 'text-red-800 dark:text-red-200';
  }

  getStatusSubTextClass(): string {
    return this.user?.isActive
      ? 'text-green-600 dark:text-green-300'
      : 'text-red-600 dark:text-red-300';
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      this.onAvatarChange.emit(file);
    }
  }
}
