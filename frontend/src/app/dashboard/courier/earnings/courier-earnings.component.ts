// src/app/dashboard/courier/earnings/courier-earnings.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  CourierDeliveryService,
  CourierEarnings,
} from '../services/courier-delivery.service';
import { SharedModule } from '../../../shared/shared.module';

interface EarningsPeriod {
  label: string;
  value: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

@Component({
  selector: 'app-courier-earnings',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './courier-earnings.component.html',
})
export class CourierEarningsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  earnings: CourierEarnings | null = null;
  loading = false;
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';

  periods: EarningsPeriod[] = [
    { label: 'Daily', value: 'daily', isActive: true },
    { label: 'Weekly', value: 'weekly', isActive: false },
    { label: 'Monthly', value: 'monthly', isActive: false },
  ];

  constructor(private courierDeliveryService: CourierDeliveryService) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEarnings(): void {
    this.loading = true;

    this.courierDeliveryService
      .getCourierEarnings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (earnings) => {
          this.earnings = earnings;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading earnings:', error);
          this.loading = false;
        },
      });
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly'): void {
    this.selectedPeriod = period;
    this.periods.forEach((p) => (p.isActive = p.value === period));
  }

  getCurrentPeriodData(): any {
    if (!this.earnings) return null;

    switch (this.selectedPeriod) {
      case 'daily':
        return this.earnings.daily;
      case 'weekly':
        return this.earnings.weekly;
      case 'monthly':
        return this.earnings.monthly;
      default:
        return this.earnings.daily;
    }
  }

  formatCurrency(amount: number): string {
    return `KES ${amount.toLocaleString()}`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getCompletionRate(): number {
    const data = this.getCurrentPeriodData();
    if (!data || !data.deliveriesCompleted) return 0;

    const total = data.deliveriesCompleted + data.pickupsCompleted;
    return total > 0 ? Math.round((data.deliveriesCompleted / total) * 100) : 0;
  }

  getAverageEarningsPerDelivery(): number {
    const data = this.getCurrentPeriodData();
    if (!data || !data.deliveriesCompleted) return 0;

    return Math.round(data.totalEarnings / data.deliveriesCompleted);
  }
}
