// src/app/admin/pages/parcels/components/parcel-stats/parcel-stats.component.ts
import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';

export interface ParcelStatsData {
  totalParcels: number;
  pendingAssignment: number;
  inTransit: number;
  delivered: number;
  monthlyGrowth: number;
}

@Component({
  selector: 'app-parcel-stats',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './parcel-stats.component.html',
})
export class ParcelStatsComponent {
  @Input() stats: ParcelStatsData = {
    totalParcels: 0,
    pendingAssignment: 0,
    inTransit: 0,
    delivered: 0,
    monthlyGrowth: 0,
  };

  get growthColorClass(): string {
    if (this.stats.monthlyGrowth > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (this.stats.monthlyGrowth < 0) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  }

  get growthIcon(): string {
    if (this.stats.monthlyGrowth > 0) {
      return 'trending-up';
    } else if (this.stats.monthlyGrowth < 0) {
      return 'trending-down';
    }
    return 'minus';
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
}
