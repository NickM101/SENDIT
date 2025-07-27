// src/app/dashboard/shared-features/settings/settings.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  imports: [SharedModule],
})
export class SettingsComponent implements OnInit {
  activeTab = 'account';

  settingsTabs: SettingsTab[] = [
    {
      id: 'account',
      label: 'Account',
      icon: 'user',
      route: 'account',
      description: 'Manage your account information and profile',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'bell',
      route: 'notifications',
      description: 'Configure how you receive updates',
    },
    // {
    //   id: 'privacy',
    //   label: 'Privacy',
    //   icon: 'shield',
    //   route: 'privacy',
    //   description: 'Control your privacy and data sharing',
    // },
    {
      id: 'security',
      label: 'Security',
      icon: 'lock',
      route: 'security',
      description: 'Password and authentication settings',
    },
    // {
    //   id: 'billing',
    //   label: 'Billing',
    //   icon: 'credit-card',
    //   route: 'billing',
    //   description: 'Payment methods and billing history',
    // },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: 'settings',
      route: 'preferences',
      description: 'Customize your experience',
    },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get active tab from route
    this.route.firstChild?.url.subscribe((url) => {
      if (url.length > 0) {
        this.activeTab = url[0].path;
      }
    });
  }

  navigateToTab(tab: SettingsTab): void {
    this.activeTab = tab.id;
    this.router.navigate([tab.route], { relativeTo: this.route });
  }

  isActiveTab(tabId: string): boolean {
    return this.activeTab === tabId;
  }
}
