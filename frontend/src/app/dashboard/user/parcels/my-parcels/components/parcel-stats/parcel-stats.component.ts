// src/app/dashboard/user/parcels/my-parcels/components/parcel-stats/parcel-stats.component.ts
import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ParcelStats } from '../../../../../../core/models/parcel.model';

@Component({
  selector: 'app-parcel-stats',
  templateUrl: './parcel-stats.component.html',
  imports: [SharedModule]
})
export class ParcelStatsComponent {
  @Input() stats: ParcelStats | null = null;
  @Input() loading = false;

  get growthIndicator(): { value: number; isPositive: boolean; text: string } {
    const growth = this.stats?.monthlyGrowth || 0;
    return {
      value: Math.abs(growth),
      isPositive: growth >= 0,
      text: growth >= 0 ? 'increase' : 'decrease',
    };
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}
