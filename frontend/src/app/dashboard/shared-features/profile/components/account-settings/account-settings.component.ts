// src/app/dashboard/shared-features/profile/components/account-settings/account-settings.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { User as UserModel } from '../../../../../auth/models/auth.models';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './account-settings.component.html',
})
export class AccountSettingsComponent implements OnInit, OnChanges {
  @Input() user: UserModel | null = null;
  @Input() isLoading = false;
  @Output() onSettingsUpdate = new EventEmitter<Partial<UserModel>>();

  settingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.user) {
      this.updateFormWithUserData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.updateFormWithUserData();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
    });
  }

  private updateFormWithUserData(): void {
    if (!this.user) return;

    this.settingsForm.patchValue({
      emailNotifications: this.user?.emailNotifications ?? true,
      smsNotifications: this.user?.smsNotifications ?? false,
    });
  }

  getAccountStatusClasses(): string {
    return this.user?.isActive
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
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

  getAccountStatusMessage(): string {
    if (!this.user) return 'Account status unknown';

    if (this.user.isActive) {
      return 'All features are available and you can send/receive parcels';
    } else {
      return 'Please verify your email or contact support to activate your account';
    }
  }

  onSubmit(): void {
    if (this.settingsForm.valid && this.settingsForm.dirty) {
      const formValue = this.settingsForm.value;
      this.onSettingsUpdate.emit({
        emailNotifications: formValue.emailNotifications,
        smsNotifications: formValue.smsNotifications,
      });
    }
  }
}
