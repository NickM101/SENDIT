// src/app/dashboard/user/tracking/components/recent-searches/recent-searches.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  TrackParcelService,
} from '../../services/track-parcel.service';
import { RecentSearch } from '../../../../../core/models/parcel.model';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-recent-searches',
  templateUrl: './recent-searches.component.html',
  imports: [SharedModule],
})
export class RecentSearchesComponent implements OnInit, OnDestroy {
  @Output() trackingNumberSelected = new EventEmitter<string>();

  recentSearches: RecentSearch[] = [];
  private destroy$ = new Subject<void>();

  constructor(private trackParcelService: TrackParcelService) {}

  ngOnInit(): void {
    this.trackParcelService.recentSearches$
      .pipe(takeUntil(this.destroy$))
      .subscribe((searches) => {
        this.recentSearches = searches;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search selection
   */
  onSelectSearch(trackingNumber: string): void {
    this.trackingNumberSelected.emit(trackingNumber);
  }

  /**
   * Clear all recent searches
   */
  onClearAll(): void {
    this.trackParcelService.clearRecentSearches();
  }

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
   * Format relative time
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
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
}
