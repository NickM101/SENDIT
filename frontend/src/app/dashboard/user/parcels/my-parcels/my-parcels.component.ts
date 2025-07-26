// src/app/dashboard/user/parcels/my-parcels/components/my-parcels/my-parcels.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';


import { SharedModule } from '../../../../shared/shared.module';
import {
  Parcel,
  ParcelStats,
  ParcelFilters,
} from '../../../../core/models/parcel.model';
import { MyParcelsService } from './services/my-parcels.service';
import { ParcelFiltersComponent } from "./components/parcel-filters/parcel-filters.component";
import { ParcelListComponent } from "./components/parcel-list/parcel-list.component";
import { ParcelStatsComponent } from "./components/parcel-stats/parcel-stats.component";
import { PaginatedResponse } from '../../../../shared/models/api.model';

@Component({
  selector: 'app-my-parcels',
  templateUrl: './my-parcels.component.html',
  imports: [SharedModule, ParcelFiltersComponent, ParcelListComponent, ParcelStatsComponent],
})
export class MyParcelsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  parcels: Parcel[] = [];
  stats: ParcelStats | null = null;
  loading = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 10;

  // Active tab
  activeTab: 'sent' | 'received' = 'sent';

  // Filters
  currentFilters: ParcelFilters = {};

  constructor(
    private myParcelsService: MyParcelsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.subscribeToData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Load stats
    this.myParcelsService
      .getParcelStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    // Load parcels
    this.loadParcels();
  }

  private subscribeToData(): void {
    // Subscribe to parcels
    combineLatest([
      this.myParcelsService.parcels$,
      this.myParcelsService.stats$,
      this.myParcelsService.loading$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([parcels, stats, loading]) => {
        this.parcels = parcels;
        this.stats = stats;
        this.loading = loading;
      });
  }

  loadParcels(page: number = 1): void {
    this.currentPage = page;
    this.myParcelsService
      .getParcels(page, this.limit, this.currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: PaginatedResponse<Parcel>) => {
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.lastPage ?? 1;
      });
  }

  onFiltersChange(filters: ParcelFilters): void {
    this.currentFilters = filters;
    this.loadParcels(1); // Reset to first page when filters change
  }

  onTabChange(tab: 'sent' | 'received'): void {
    this.activeTab = tab;
    // You could modify the filters here to show sent vs received parcels
    // For now, we'll assume the API handles this based on the authenticated user
    this.loadParcels(1);
  }

  onPageChange(page: number): void {
    this.loadParcels(page);
  }

  onParcelAction(action: { type: string; parcel: Parcel }): void {
    switch (action.type) {
      case 'view':
        this.viewParcel(action.parcel);
        break;
      case 'track':
        this.trackParcel(action.parcel);
        break;
      case 'edit':
        this.editParcel(action.parcel);
        break;
      case 'cancel':
        this.cancelParcel(action.parcel);
        break;
      case 'receipt':
        this.downloadReceipt(action.parcel);
        break;
      case 'reorder':
        this.reorderParcel(action.parcel);
        break;
      default:
        console.log('Unknown action:', action.type);
    }
  }

  onExportData(): void {
    this.myParcelsService
      .exportParcels('csv', this.currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `parcels-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }

  onSendNewParcel(): void {
    this.router.navigate(['/dashboard/user/parcels/send']);
  }

  refreshData(): void {
    this.myParcelsService.refreshParcels();
    this.myParcelsService
      .getParcelStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private viewParcel(parcel: Parcel): void {
    this.router.navigate(['/dashboard/user/parcels/details', parcel.id]);
  }

  private trackParcel(parcel: Parcel): void {
    this.router.navigate([
      '/dashboard/user/parcels/track',
      parcel.trackingNumber,
    ]);
  }

  private editParcel(parcel: Parcel): void {
    this.router.navigate(['/dashboard/user/parcels/edit', parcel.id]);
  }

  private cancelParcel(parcel: Parcel): void {
    if (confirm('Are you sure you want to cancel this parcel?')) {
      this.myParcelsService
        .cancelParcel(parcel.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Success handled by service refresh
          },
          error: (error) => {
            console.error('Error cancelling parcel:', error);
            // Handle error (show toast, etc.)
          },
        });
    }
  }

  private downloadReceipt(parcel: Parcel): void {
    // Implement receipt download
    console.log('Download receipt for parcel:', parcel.trackingNumber);
  }

  private reorderParcel(parcel: Parcel): void {
    this.router.navigate(['/dashboard/user/parcels/send'], {
      queryParams: { reorder: parcel.id },
    });
  }

  // Utility methods
  getStatusCounts(): { [key: string]: number } {
    if (!this.stats) return {};

    return {
      total: this.stats.totalSent,
      delivered: this.stats.delivered,
      inTransit: this.stats.inTransit,
      pending: this.stats.pending,
    };
  }
}
