// src/app/admin/pages/parcels/components/parcel-details-modal/parcel-details-modal.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Parcel, StatusConfig } from '../../../../../core/models/parcel.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { ParcelService } from '../../../../services/parcel.service';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-parcel-details-modal',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './parcel-details-modal.component.html',
})
export class ParcelDetailsModalComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly parcelService = inject(ParcelService);
  private readonly toastService = inject(ToastService);

  @Input() parcel: Parcel | null = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  parcelDetails: any = null;
  loading = false;
  activeTab = 'details';
  statusConfig = StatusConfig;

  // Tabs configuration
  tabs = [
    { id: 'details', label: 'Details', icon: 'info' },
    { id: 'tracking', label: 'Tracking History', icon: 'map-pin' },
    { id: 'delivery', label: 'Delivery Attempts', icon: 'truck' },
  ];

  ngOnInit(): void {
    if (this.show && this.parcel) {
      this.loadParcelDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadParcelDetails(): void {
    if (!this.parcel) return;

    this.loading = true;

    this.parcelService
      .getParcelByTrackingNumber(this.parcel.trackingNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.parcelDetails = details;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading parcel details:', error);
          this.toastService.error('Failed to load parcel details');
          this.loading = false;
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Helper methods
  getStatusConfig(status: string) {
    return (
      this.statusConfig[status as keyof typeof StatusConfig] ||
      this.statusConfig.PROCESSING
    );
  }

  formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastService.success('Copied to clipboard');
      })
      .catch(() => {
        this.toastService.error('Failed to copy to clipboard');
      });
  }

  getTrackingIcon(status: string): string {
    const config = this.getStatusConfig(status);
    return config.icon;
  }

  getDeliveryAttemptStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'attempted':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }
}
