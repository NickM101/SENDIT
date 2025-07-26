// src/app/dashboard/user/tracking/components/parcel-info-card/parcel-info-card.component.ts
import { Component, Input } from '@angular/core';
import {
  TrackParcelService,
} from '../../services/track-parcel.service';
import { ParcelDetails } from '../../../../../core/models/parcel.model';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-parcel-info-card',
  templateUrl: './parcel-info-card.component.html',
  imports: [SharedModule],
})
export class ParcelInfoCardComponent {
  @Input() parcel!: ParcelDetails;

  constructor(private trackParcelService: TrackParcelService) {}

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    return this.trackParcelService.getStatusColor(status);
  }

  /**
   * Format status text
   */
  formatStatus(status: string): string {
    return this.trackParcelService.formatStatus(status);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get estimated delivery status
   */
  getDeliveryStatus(): { text: string; color: string; icon: string } {
    if (this.parcel.status === 'DELIVERED') {
      return {
        text: 'Delivered',
        color: 'text-green-600 dark:text-green-400',
        icon: 'check-circle-2',
      };
    }

    if (this.parcel.status === 'DELAYED') {
      return {
        text: 'Delayed',
        color: 'text-red-600 dark:text-red-400',
        icon: 'alert-triangle',
      };
    }

    if (this.parcel.estimatedDelivery) {
      const estimatedDate = new Date(this.parcel.estimatedDelivery);
      const today = new Date();
      const diffTime = estimatedDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: 'Overdue',
          color: 'text-red-600 dark:text-red-400',
          icon: 'alert-circle',
        };
      } else if (diffDays === 0) {
        return {
          text: 'Today',
          color: 'text-green-600 dark:text-green-400',
          icon: 'clock',
        };
      } else if (diffDays === 1) {
        return {
          text: 'Tomorrow',
          color: 'text-blue-600 dark:text-blue-400',
          icon: 'clock',
        };
      } else {
        return {
          text: `${diffDays} days`,
          color: 'text-gray-600 dark:text-gray-400',
          icon: 'calendar',
        };
      }
    }

    return {
      text: 'TBD',
      color: 'text-gray-600 dark:text-gray-400',
      icon: 'help-circle',
    };
  }

  /**
   * Get package type icon
   */
  getPackageTypeIcon(packageType: string): string {
    const typeIcons: { [key: string]: string } = {
      STANDARD_BOX: 'box',
      DOCUMENT: 'file-text',
      CLOTHING: 'shirt',
      ELECTRONICS: 'smartphone',
      FRAGILE: 'alert-triangle',
      LIQUID: 'droplets',
      PERISHABLE: 'thermometer',
    };
    return typeIcons[packageType] || 'package';
  }

  /**
   * Get delivery type description
   */
  getDeliveryTypeDescription(deliveryType: string): string {
    const descriptions: { [key: string]: string } = {
      STANDARD: '3-5 business days',
      EXPRESS: '1-2 business days',
      SAME_DAY: 'Same day delivery',
      OVERNIGHT: 'Next business day',
    };
    return descriptions[deliveryType] || 'Standard delivery';
  }
}
