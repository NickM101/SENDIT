// src/app/dashboard/shared-features/settings/components/security-settings/security-settings.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
  browser: string;
  os: string;
}

@Component({
  selector: 'app-security-settings',
  templateUrl: './security-settings.component.html',
  imports: [SharedModule]
})
export class SecuritySettingsComponent implements OnInit {
  changePasswordForm: FormGroup;
  twoFactorEnabled = false;
  showQrCode = false;
  backupCodes: string[] = [];
  showBackupCodes = false;

  securitySettings = {
    loginAlerts: true,
    deviceTracking: true,
    dataExport: false,
    sessionTimeout: 30,
  };

  activeSessions: LoginSession[] = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ipAddress: '192.168.1.1',
      lastActive: new Date(),
      isCurrent: true,
      browser: 'Chrome 120.0',
      os: 'Windows 11',
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, NY',
      ipAddress: '192.168.1.2',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isCurrent: false,
      browser: 'Safari 17.0',
      os: 'iOS 17.1',
    },
    {
      id: '3',
      device: 'Firefox on MacOS',
      location: 'Brooklyn, NY',
      ipAddress: '192.168.1.3',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isCurrent: false,
      browser: 'Firefox 121.0',
      os: 'macOS Sonoma',
    },
  ];

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors!['passwordMismatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  changePassword(): void {
    if (this.changePasswordForm.valid) {
      const formData = this.changePasswordForm.value;
      console.log('Changing password:', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Reset form after successful change
      this.changePasswordForm.reset();

      // Show success message
      alert('Password changed successfully!');
    }
  }

  enableTwoFactor(): void {
    this.showQrCode = true;
    console.log('Enabling two-factor authentication');
  }

  confirmTwoFactor(code: string): void {
    if (code.length === 6) {
      this.twoFactorEnabled = true;
      this.showQrCode = false;
      this.generateBackupCodes();
      console.log('Two-factor authentication enabled with code:', code);
    }
  }

  disableTwoFactor(): void {
    const confirmation = confirm(
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
    );
    if (confirmation) {
      this.twoFactorEnabled = false;
      this.backupCodes = [];
      console.log('Two-factor authentication disabled');
    }
  }

  generateBackupCodes(): void {
    this.backupCodes = [
      'A1B2C3D4E5',
      'F6G7H8I9J0',
      'K1L2M3N4O5',
      'P6Q7R8S9T0',
      'U1V2W3X4Y5',
      'Z6A7B8C9D0',
      'E1F2G3H4I5',
      'J6K7L8M9N0',
    ];
    this.showBackupCodes = true;
  }

  downloadBackupCodes(): void {
    const codes = this.backupCodes.join('\n');
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'backup-codes.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  updateSecuritySetting<K extends keyof typeof this.securitySettings>(
    setting: K,
    value: (typeof this.securitySettings)[K]
  ): void {
    this.securitySettings[setting] = value;
    this.saveSecuritySettings();
  }

  saveSecuritySettings(): void {
    console.log('Saving security settings:', this.securitySettings);
  }

  terminateSession(sessionId: string): void {
    if (sessionId === '1') {
      alert('Cannot terminate current session');
      return;
    }

    const confirmation = confirm(
      'Are you sure you want to terminate this session?'
    );
    if (confirmation) {
      this.activeSessions = this.activeSessions.filter(
        (s) => s.id !== sessionId
      );
      console.log('Session terminated:', sessionId);
    }
  }

  terminateAllOtherSessions(): void {
    const confirmation = confirm(
      'Are you sure you want to terminate all other sessions? You will need to log in again on those devices.'
    );
    if (confirmation) {
      this.activeSessions = this.activeSessions.filter((s) => s.isCurrent);
      console.log('All other sessions terminated');
    }
  }

  exportAccountData(): void {
    console.log('Exporting account data...');
    // Implement data export functionality
  }

  requestAccountDeletion(): void {
    const confirmation = confirm(
      'Are you sure you want to request account deletion? This action cannot be undone and will permanently delete all your data.'
    );
    if (confirmation) {
      console.log('Account deletion requested');
      // Implement account deletion request
    }
  }
}
