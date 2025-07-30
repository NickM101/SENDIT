// src/app/admin/pages/parcels/parcels.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ParcelFiltersComponent } from './components/parcel-filters/parcel-filters.component';
import { ParcelStatsComponent } from './components/parcel-stats/parcel-stats.component';
import { ParcelTableComponent } from './components/parcel-table/parcel-table.component';
import { AssignCourierModalComponent } from './components/assign-courier-modal/assign-courier-modal.component';
import { ParcelDetailsModalComponent } from './components/parcel-details-modal/parcel-details-modal.component';
import { SharedModule } from '../../../shared/shared.module';
import { Parcel, ParcelFilters, ParcelStatus, PackageType, DeliveryType, StatusConfig } from '../../../core/models/parcel.model';
import { ToastService } from '../../../core/services/toast.service';
import { ParcelService } from '../../services/parcel.service';

@Component({
  selector: 'app-admin-parcels',
  standalone: true,
  imports: [
    SharedModule,
    ParcelFiltersComponent,
    ParcelStatsComponent,
    ParcelTableComponent,
    AssignCourierModalComponent,
    ParcelDetailsModalComponent,
  ],
  templateUrl: './parcels.component.html',
})
export class AdminParcelsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly parcelService = inject(ParcelService);
  private readonly toastService = inject(ToastService);

  // State
  parcels: Parcel[] = [];
  loading = false;
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  // Modal states
  showAssignCourierModal = false;
  showParcelDetailsModal = false;
  selectedParcel: Parcel | null = null;

  // Filters
  filters: ParcelFilters = {};
  searchForm: FormGroup;

  // Stats
  stats = {
    totalParcels: 0,
    pendingAssignment: 0,
    inTransit: 0,
    delivered: 0,
    monthlyGrowth: 0,
  };

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      status: [''],
      startDate: [''],
      endDate: [''],
      packageType: [''],
      deliveryType: [''],
    });

    this.setupSearchSubscription();
  }

  ngOnInit(): void {
    this.loadParcels();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription(): void {
    this.searchForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.filters = this.cleanFilters(filters);
        this.currentPage = 1;
        this.loadParcels();
      });
  }

  private cleanFilters(filters: any): ParcelFilters {
    const cleaned: ParcelFilters = {};

    if (filters.search?.trim()) {
      cleaned.search = filters.search.trim();
    }
    if (filters.status) {
      cleaned.status = filters.status as ParcelStatus;
    }
    if (filters.startDate) {
      cleaned.startDate = new Date(filters.startDate);
    }
    if (filters.endDate) {
      cleaned.endDate = new Date(filters.endDate);
    }
    if (filters.packageType) {
      cleaned.packageType = filters.packageType as PackageType;
    }
    if (filters.deliveryType) {
      cleaned.deliveryType = filters.deliveryType as DeliveryType;
    }

    return cleaned;
  }

  loadParcels(): void {
    this.loading = true;

    const queryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filters,
    };

    this.parcelService
      .getAdminParcels(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.parcels = response.items;
          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading parcels:', error);
          this.toastService.error('Failed to load parcels');
          this.loading = false;
        },
      });
  }

  loadStats(): void {
    this.parcelService
      .getAdminStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadParcels();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadParcels();
  }

  onFiltersChange(filters: ParcelFilters): void {
    this.filters = filters;
    this.currentPage = 1;
    this.searchForm.patchValue(filters, { emitEvent: false });
    this.loadParcels();
  }

  onClearFilters(): void {
    this.filters = {};
    this.searchForm.reset();
    this.currentPage = 1;
    this.loadParcels();
  }

  // Parcel Actions
  onViewParcel(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.showParcelDetailsModal = true;
  }

  onAssignCourier(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.showAssignCourierModal = true;
  }

  onUpdateStatus(parcel: Parcel, status: ParcelStatus): void {
    this.parcelService
      .updateParcelStatus(parcel.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Parcel status updated successfully');
          this.loadParcels();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.toastService.error('Failed to update parcel status');
        },
      });
  }

  onDeleteParcel(parcel: Parcel): void {
    if (
      confirm(
        `Are you sure you want to delete parcel ${parcel.trackingNumber}?`
      )
    ) {
      this.parcelService
        .deleteParcel(parcel.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Parcel deleted successfully');
            this.loadParcels();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting parcel:', error);
            this.toastService.error('Failed to delete parcel');
          },
        });
    }
  }

  // Modal Events
  onAssignCourierSuccess(): void {
    this.showAssignCourierModal = false;
    this.selectedParcel = null;
    this.loadParcels();
    this.loadStats();
  }

  onCloseModal(): void {
    this.showAssignCourierModal = false;
    this.showParcelDetailsModal = false;
    this.selectedParcel = null;
  }


  // Bulk Actions
  onBulkAction(action: string, selectedIds: string[]): void {
    if (selectedIds.length === 0) {
      this.toastService.warning('Please select parcels to perform bulk action');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedIds.length} parcel(s)?`;

    if (confirm(confirmMessage)) {
      this.parcelService
        .bulkAction(action, selectedIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success(`Bulk ${action} completed successfully`);
            this.loadParcels();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error performing bulk action:', error);
            this.toastService.error(`Failed to perform bulk ${action}`);
          },
        });
    }
  }

  // Refresh data
  onRefresh(): void {
    this.loadParcels();
    this.loadStats();
  }

  // Utility methods
  getStatusConfig(status: ParcelStatus) {
    return StatusConfig[status] || StatusConfig[ParcelStatus.PROCESSING];
  }

  trackByParcelId(index: number, parcel: Parcel): string {
    return parcel.id;
  }
}
