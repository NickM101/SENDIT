// src/app/dashboard/shared-features/settings/services/settings.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface UserSettings {
  notifications: NotificationSettings;
  security: SecuritySettings;
  preferences: UserPreferences;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    [key: string]: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
  sessionTimeout: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  itemsPerPage: number;
  autoRefresh: boolean;
  refreshInterval: number;
  compactMode: boolean;
  showPreview: boolean;
  soundEffects: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly API_URL = environment.apiUrl;
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  private loadSettings(): void {
    // Load settings from localStorage as fallback
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      this.settingsSubject.next(JSON.parse(savedSettings));
    }
  }

  // Account Settings
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/users/profile`, profileData);
  }

  updateAddress(address: string): Observable<any> {
    return this.http.put(`${this.API_URL}/users/address`, { address });
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.API_URL}/users/profile-picture`, formData);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/account`);
  }

  // Security Settings
  changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Observable<any> {
    return this.http.put(`${this.API_URL}/users/change-password`, passwordData);
  }

  enableTwoFactor(): Observable<{ qrCode: string; secret: string }> {
    return this.http.post<{ qrCode: string; secret: string }>(
      `${this.API_URL}/auth/2fa/enable`,
      {}
    );
  }

  verifyTwoFactor(code: string): Observable<{ backupCodes: string[] }> {
    return this.http.post<{ backupCodes: string[] }>(
      `${this.API_URL}/auth/2fa/verify`,
      { code }
    );
  }

  disableTwoFactor(): Observable<any> {
    return this.http.delete(`${this.API_URL}/auth/2fa/disable`);
  }

  getActiveSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/auth/sessions`);
  }

  terminateSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/auth/sessions/${sessionId}`);
  }

  terminateAllOtherSessions(): Observable<any> {
    return this.http.delete(`${this.API_URL}/auth/sessions/others`);
  }

  updateSecuritySettings(settings: SecuritySettings): Observable<any> {
    const currentSettings = this.settingsSubject.value;
    if (currentSettings) {
      currentSettings.security = settings;
      this.settingsSubject.next(currentSettings);
      localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    }
    return this.http.put(`${this.API_URL}/users/security-settings`, settings);
  }

  // Notification Settings
  updateNotificationSettings(settings: NotificationSettings): Observable<any> {
    const currentSettings = this.settingsSubject.value;
    if (currentSettings) {
      currentSettings.notifications = settings;
      this.settingsSubject.next(currentSettings);
      localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    }
    return this.http.put(
      `${this.API_URL}/users/notification-settings`,
      settings
    );
  }

  // User Preferences
  updatePreferences(preferences: UserPreferences): Observable<any> {
    const currentSettings = this.settingsSubject.value;
    if (currentSettings) {
      currentSettings.preferences = preferences;
      this.settingsSubject.next(currentSettings);
      localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    }
    return this.http.put(`${this.API_URL}/users/preferences`, preferences);
  }

  // Data Export
  exportAccountData(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/users/export-data`, {
      responseType: 'blob',
    });
  }

  // Settings Management
  getAllSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.API_URL}/users/settings`);
  }

  resetSettings(): Observable<UserSettings> {
    return this.http.post<UserSettings>(
      `${this.API_URL}/users/settings/reset`,
      {}
    );
  }

  // Theme Management
  applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Save theme preference
    localStorage.setItem('theme', theme);
  }

  getCurrentTheme(): 'light' | 'dark' | 'system' {
    return (
      (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
    );
  }

  // Helper methods
  getCurrentSettings(): UserSettings | null {
    return this.settingsSubject.value;
  }

  updateSetting(category: keyof UserSettings, key: string, value: any): void {
    const currentSettings = this.settingsSubject.value;
    if (currentSettings && currentSettings[category]) {
      (currentSettings[category] as any)[key] = value;
      this.settingsSubject.next(currentSettings);
      localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    }
  }
}
