// src/app/dashboard/shared-features/settings/components/preferences/preferences.component.ts

import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';

interface Preference {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'range';
  value: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
}

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  imports: [SharedModule]
})
export class PreferencesComponent implements OnInit {
  preferences: Preference[] = [
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred color scheme',
      type: 'select',
      value: 'system',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Select your preferred language',
      type: 'select',
      value: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'Swahili', value: 'sw' },
      ],
    },
    {
      id: 'timezone',
      title: 'Timezone',
      description: 'Your local timezone for date and time display',
      type: 'select',
      value: 'America/New_York',
      options: [
        { label: 'Eastern Time (ET)', value: 'America/New_York' },
        { label: 'Central Time (CT)', value: 'America/Chicago' },
        { label: 'Mountain Time (MT)', value: 'America/Denver' },
        { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
        { label: 'East Africa Time (EAT)', value: 'Africa/Nairobi' },
        { label: 'UTC', value: 'UTC' },
      ],
    },
    {
      id: 'currency',
      title: 'Currency',
      description: 'Default currency for pricing and billing',
      type: 'select',
      value: 'KES',
      options: [
        { label: 'Kenyan Shilling (KES)', value: 'KES' },
        { label: 'US Dollar (USD)', value: 'USD' },
        { label: 'Euro (EUR)', value: 'EUR' },
        { label: 'British Pound (GBP)', value: 'GBP' },
      ],
    },
    {
      id: 'dateFormat',
      title: 'Date Format',
      description: 'How dates should be displayed',
      type: 'select',
      value: 'MM/dd/yyyy',
      options: [
        { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
        { label: 'dd/MM/yyyy', value: 'dd/MM/yyyy' },
        { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
        { label: 'MMM dd, yyyy', value: 'MMM dd, yyyy' },
      ],
    },
    {
      id: 'itemsPerPage',
      title: 'Items per Page',
      description: 'Number of items to show in lists and tables',
      type: 'select',
      value: 10,
      options: [
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '25', value: 25 },
        { label: '50', value: 50 },
        { label: '100', value: 100 },
      ],
    },
    {
      id: 'autoRefresh',
      title: 'Auto-refresh Dashboard',
      description: 'Automatically refresh dashboard data',
      type: 'toggle',
      value: true,
    },
    {
      id: 'refreshInterval',
      title: 'Refresh Interval',
      description: 'How often to refresh data (in seconds)',
      type: 'range',
      value: 30,
      min: 10,
      max: 300,
      step: 10,
    },
    {
      id: 'compactMode',
      title: 'Compact Mode',
      description: 'Use compact layout to show more information',
      type: 'toggle',
      value: false,
    },
    {
      id: 'showPreview',
      title: 'Show Preview Cards',
      description: 'Display preview cards when hovering over items',
      type: 'toggle',
      value: true,
    },
    {
      id: 'soundEffects',
      title: 'Sound Effects',
      description: 'Play sounds for notifications and actions',
      type: 'toggle',
      value: false,
    },
    {
      id: 'animationSpeed',
      title: 'Animation Speed',
      description: 'Speed of UI animations and transitions',
      type: 'select',
      value: 'normal',
      options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Normal', value: 'normal' },
        { label: 'Fast', value: 'fast' },
        { label: 'None', value: 'none' },
      ],
    },
  ];

  displayPreferences: Preference[] = [];
  behaviorPreferences: Preference[] = [];
  accessibilityPreferences: Preference[] = [];

  constructor() {}

  ngOnInit(): void {
    this.categorizePreferences();
  }

  categorizePreferences(): void {
    this.displayPreferences = this.preferences.filter((p) =>
      [
        'theme',
        'language',
        'timezone',
        'currency',
        'dateFormat',
        'compactMode',
      ].includes(p.id)
    );

    this.behaviorPreferences = this.preferences.filter((p) =>
      [
        'itemsPerPage',
        'autoRefresh',
        'refreshInterval',
        'showPreview',
      ].includes(p.id)
    );

    this.accessibilityPreferences = this.preferences.filter((p) =>
      ['soundEffects', 'animationSpeed'].includes(p.id)
    );
  }

  updatePreference(preferenceId: string, value: any): void {
    const preference = this.preferences.find((p) => p.id === preferenceId);
    if (preference) {
      preference.value = value;
      this.savePreferences();

      // Apply theme change immediately
      if (preferenceId === 'theme') {
        this.applyTheme(value);
      }
    }
  }

  applyTheme(theme: string): void {
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
  }

  savePreferences(): void {
    console.log('Saving preferences:', this.preferences);
    // Implement API call to save preferences
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
  }

  resetToDefaults(): void {
    const confirmation = confirm(
      'Are you sure you want to reset all preferences to default values?'
    );
    if (confirmation) {
      // Reset all preferences to default values
      this.preferences.forEach((preference) => {
        switch (preference.id) {
          case 'theme':
            preference.value = 'system';
            break;
          case 'language':
            preference.value = 'en';
            break;
          case 'timezone':
            preference.value = 'America/New_York';
            break;
          case 'currency':
            preference.value = 'KES';
            break;
          case 'dateFormat':
            preference.value = 'MM/dd/yyyy';
            break;
          case 'itemsPerPage':
            preference.value = 10;
            break;
          case 'autoRefresh':
            preference.value = true;
            break;
          case 'refreshInterval':
            preference.value = 30;
            break;
          case 'compactMode':
            preference.value = false;
            break;
          case 'showPreview':
            preference.value = true;
            break;
          case 'soundEffects':
            preference.value = false;
            break;
          case 'animationSpeed':
            preference.value = 'normal';
            break;
        }
      });

      this.savePreferences();
      this.applyTheme('system');
    }
  }

  exportPreferences(): void {
    const data = JSON.stringify(this.preferences, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sendit-preferences.json';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importPreferences(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPreferences = JSON.parse(e.target?.result as string);

          // Validate and update preferences
          importedPreferences.forEach((imported: any) => {
            const existing = this.preferences.find((p) => p.id === imported.id);
            if (existing) {
              existing.value = imported.value;
            }
          });

          this.savePreferences();
          this.applyTheme(
            this.preferences.find((p) => p.id === 'theme')?.value || 'system'
          );
          alert('Preferences imported successfully!');
        } catch (error) {
          alert('Error importing preferences. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }
}
