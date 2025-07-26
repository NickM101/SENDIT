// src/app/dashboard/user/tracking/components/tracking-timeline/tracking-timeline.component.ts
import { Component, Input } from '@angular/core';
import {
  TrackParcelService,
} from '../../services/track-parcel.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { TrackingHistory } from '../../../../../core/models/parcel.model';

@Component({
  selector: 'app-tracking-timeline',
  templateUrl: './tracking-timeline.component.html',
  imports: [SharedModule]
})
export class TrackingTimelineComponent {
  @Input() trackingHistory: TrackingHistory[] = [];

  constructor(private trackParcelService: TrackParcelService) {}

  /**
   * Get status icon for timeline item
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
    return statusIcons[status] || 'circle';
  }

  /**
   * Get status color for timeline item
   */
  getStatusIconColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      PROCESSING: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      PAYMENT_PENDING: 'text-orange-600 bg-orange-100 dark:bg-orange-900',
      PAYMENT_CONFIRMED: 'text-green-600 bg-green-100 dark:bg-green-900',
      PICKED_UP: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      IN_TRANSIT: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
      OUT_FOR_DELIVERY: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900',
      DELIVERED: 'text-green-600 bg-green-100 dark:bg-green-900',
      DELAYED: 'text-red-600 bg-red-100 dark:bg-red-900',
      RETURNED: 'text-gray-600 bg-gray-100 dark:bg-gray-900',
      CANCELLED: 'text-red-600 bg-red-100 dark:bg-red-900',
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-900';
  }

  /**
   * Format status text
   */
  formatStatus(status: string): string {
    return this.trackParcelService.formatStatus(status);
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
   * Format time
   */
  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Check if this is the latest update
   */
  isLatestUpdate(index: number): boolean {
    return index === 0;
  }

  /**
   * Check if this is a completed status
   */
  isCompletedStatus(status: string): boolean {
    return ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(status);
  }
}
