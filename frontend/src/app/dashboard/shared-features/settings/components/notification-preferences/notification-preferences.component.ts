// src/app/dashboard/shared-features/settings/components/notification-preferences/notification-preferences.component.ts

import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  category: string;
}

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.component.html',
  imports: [SharedModule]
})
export class NotificationPreferencesComponent implements OnInit {
  notifications: NotificationSetting[] = [
    {
      id: 'parcel_created',
      title: 'Parcel Created',
      description: 'When a new parcel is created',
      email: true,
      sms: false,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'parcel_picked_up',
      title: 'Parcel Picked Up',
      description: 'When your parcel is picked up from sender',
      email: true,
      sms: true,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'in_transit',
      title: 'In Transit',
      description: 'When your parcel is in transit',
      email: true,
      sms: false,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'When your parcel is out for delivery',
      email: true,
      sms: true,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'delivered',
      title: 'Delivered',
      description: 'When your parcel is delivered',
      email: true,
      sms: true,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'delivery_delayed',
      title: 'Delivery Delayed',
      description: 'When there are delays in delivery',
      email: true,
      sms: true,
      push: true,
      category: 'Parcel Updates'
    },
    {
      id: 'payment_confirmed',
      title: 'Payment Confirmed',
      description: 'When payment is successfully processed',
      email: true,
      sms: false,
      push: true,
      category: 'Payment & Billing'
    },
    {
      id: 'payment_failed',
      title: 'Payment Failed',
      description: 'When payment processing fails',
      email: true,
      sms: true,
      push: true,
      category: 'Payment & Billing'
    },
    {
      id: 'invoice_generated',
      title: 'Invoice Generated',
      description: 'When a new invoice is generated',
      email: true,
      sms: false,
      push: false,
      category: 'Payment & Billing'
    },
    {
      id: 'promotional_offers',
      title: 'Promotional Offers',
      description: 'Special offers and discounts',
      email: true,
      sms: false,
      push: false,
      category: 'Marketing'
    },
    {
      id: 'service_updates',
      title: 'Service Updates',
      description: 'Updates about new features and services',
      email: true,
      sms: false,
      push: false,
      category: 'Marketing'
    },
    {
      id: 'security_alerts',
      title: 'Security Alerts',
      description: 'Important security notifications',
      email: true,
      sms: true,
      push: true,
      category: 'Security'
    }
  ];

  globalSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  } = {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  };

  categories: string[] = [];

  constructor() {}

  ngOnInit(): void {
    this.categories = [...new Set(this.notifications.map(n => n.category))];
  }

  getNotificationsByCategory(category: string): NotificationSetting[] {
    return this.notifications.filter(n => n.category === category);
  }

  updateNotification(notificationId: string, type: 'email' | 'sms' | 'push', value: boolean): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification[type] = value;
      this.saveNotificationSettings();
    }
  }

  toggleGlobalSetting(
    setting: 'emailEnabled' | 'smsEnabled' | 'pushEnabled' | 'quietHoursEnabled'
  ): void {
    this.globalSettings[setting] = !this.globalSettings[setting];
    this.saveGlobalSettings();
  }

  updateQuietHours(type: 'start' | 'end', value: string): void {
    if (type === 'start') {
      this.globalSettings.quietHoursStart = value;
    } else {
      this.globalSettings.quietHoursEnd = value;
    }
    this.saveGlobalSettings();
  }

  saveNotificationSettings(): void {
    console.log('Saving notification settings:', this.notifications);
    // Implement API call to save settings
  }

  saveGlobalSettings(): void {
    console.log('Saving global settings:', this.globalSettings);
    // Implement API call to save global settings
  }

  resetToDefaults(): void {
    const confirmation = confirm('Are you sure you want to reset all notification preferences to default settings?');
    if (confirmation) {
      // Reset all notifications to default values
      this.notifications.forEach(notification => {
        switch (notification.category) {
          case 'Parcel Updates':
            notification.email = true;
            notification.sms = notification.id === 'parcel_picked_up' || notification.id === 'out_for_delivery' || notification.id === 'delivered' || notification.id === 'delivery_delayed';
            notification.push = true;
            break;
          case 'Payment & Billing':
            notification.email = true;
            notification.sms = notification.id === 'payment_failed';
            notification.push = notification.id !== 'invoice_generated';
            break;
          case 'Marketing':
            notification.email = true;
            notification.sms = false;
            notification.push = false;
            break;
          case 'Security':
            notification.email = true;
            notification.sms = true;
            notification.push = true;
            break;
        }
      });
      this.saveNotificationSettings();
    }
  }
}