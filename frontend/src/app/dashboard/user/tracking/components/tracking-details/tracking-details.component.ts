// src/app/dashboard/user/tracking/components/tracking-details/tracking-details.component.ts
import { Component, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  TrackParcelService,
} from '../../services/track-parcel.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { ParcelDetails } from '../../../../../core/models/parcel.model';

@Component({
  selector: 'app-tracking-details',
  templateUrl: './tracking-details.component.html',
  imports: [SharedModule]
})
export class TrackingDetailsComponent {
  @Input() parcel!: ParcelDetails;

  constructor(private trackParcelService: TrackParcelService, private clipboard: Clipboard) {}

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
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      PROCESSING: 'clock',
      PAYMENT_PENDING: 'credit-card',
      PAYMENT_CONFIRMED: 'check-circle',
      PICKED_UP: 'package',
      IN_TRANSIT: 'truck',
      OUT_FOR_DELIVERY: 'map-pin',
      DELIVERED: 'check-circle-2',
      DELAYED: 'alert-triangle',
      RETURNED: 'rotate-ccw',
      CANCELLED: 'x-circle',
    };
    return statusIcons[status] || 'package';
  }

  /**
   * Calculate delivery progress percentage
   */
  getDeliveryProgress(): number {
    const statusProgress: { [key: string]: number } = {
      PROCESSING: 10,
      PAYMENT_PENDING: 20,
      PAYMENT_CONFIRMED: 30,
      PICKED_UP: 50,
      IN_TRANSIT: 70,
      OUT_FOR_DELIVERY: 90,
      DELIVERED: 100,
      DELAYED: 70,
      RETURNED: 100,
      CANCELLED: 0,
    };
    return statusProgress[this.parcel.status] || 0;
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  copyToClipboard(text: string): void { this.clipboard.copy(text); } 
}
