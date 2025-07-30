// src/app/admin/pages/parcels/components/parcel-table/parcel-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { Parcel, ParcelStatus, StatusConfig, ParcelAction } from '../../../../../core/models/parcel.model';

@Component({
  selector: 'app-parcel-table',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './parcel-table.component.html',
})
export class ParcelTableComponent {
  @Input() parcels: Parcel[] = [];
  @Input() loading = false;
  @Input() totalRecords = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() viewParcel = new EventEmitter<Parcel>();
  @Output() assignCourier = new EventEmitter<Parcel>();
  @Output() updateStatus = new EventEmitter<{
    parcel: Parcel;
    status: ParcelStatus;
  }>();
  @Output() deleteParcel = new EventEmitter<Parcel>();
  @Output() bulkAction = new EventEmitter<{
    action: string;
    selectedIds: string[];
  }>();

  // Selection state
  selectedParcels = new Set<string>();
  selectAll = new FormControl(false);

  // Pagination options
  pageSizeOptions = [10, 25, 50, 100];

  // Status configurations
  statusConfig = StatusConfig;

  // Bulk action options
  bulkActions = [
    { label: 'Assign Courier', value: 'assign', icon: 'user-plus' },
    { label: 'Mark as Processing', value: 'processing', icon: 'clock' },
    { label: 'Cancel Parcels', value: 'cancel', icon: 'x-circle' },
    { label: 'Export Selected', value: 'export', icon: 'download' },
  ];

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  get isAllSelected(): boolean {
    return (
      this.parcels.length > 0 &&
      this.selectedParcels.size === this.parcels.length
    );
  }

  get isIndeterminate(): boolean {
    return (
      this.selectedParcels.size > 0 &&
      this.selectedParcels.size < this.parcels.length
    );
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedParcels.clear();
    } else {
      this.parcels.forEach((parcel) => this.selectedParcels.add(parcel.id));
    }
    this.updateSelectAllState();
  }

  toggleSelectParcel(parcelId: string): void {
    if (this.selectedParcels.has(parcelId)) {
      this.selectedParcels.delete(parcelId);
    } else {
      this.selectedParcels.add(parcelId);
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    if (this.isAllSelected) {
      this.selectAll.setValue(true);
    } else if (this.selectedParcels.size === 0) {
      this.selectAll.setValue(false);
    } else {
      this.selectAll.setValue(null); // Indeterminate state
    }
  }

  isSelected(parcelId: string): boolean {
    return this.selectedParcels.has(parcelId);
  }

  // Action methods
  getParcelActions(parcel: Parcel): ParcelAction[] {
    const actions: ParcelAction[] = [
      {
        label: 'View Details',
        icon: 'eye',
        action: 'view',
        color: 'secondary',
      },
    ];

    // Add status-specific actions
    if (
      parcel.status === ParcelStatus.PAYMENT_CONFIRMED ||
      parcel.status === ParcelStatus.PROCESSING
    ) {
      actions.push({
        label: 'Assign Courier',
        icon: 'user-plus',
        action: 'assign',
        color: 'primary',
      });
    }

    if (
      [ParcelStatus.PROCESSING, ParcelStatus.PAYMENT_PENDING].includes(
        parcel.status
      )
    ) {
      actions.push({
        label: 'Cancel',
        icon: 'x-circle',
        action: 'cancel',
        color: 'danger',
      });
    }

    actions.push({
      label: 'Delete',
      icon: 'trash-2',
      action: 'delete',
      color: 'danger',
    });

    return actions;
  }

  onParcelAction(parcel: Parcel, action: string): void {
    switch (action) {
      case 'view':
        this.viewParcel.emit(parcel);
        break;
      case 'assign':
        this.assignCourier.emit(parcel);
        break;
      case 'cancel':
        this.updateStatus.emit({ parcel, status: ParcelStatus.CANCELLED });
        break;
      case 'delete':
        this.deleteParcel.emit(parcel);
        break;
    }
  }

  onBulkAction(action: string): void {
    if (this.selectedParcels.size === 0) return;

    this.bulkAction.emit({
      action,
      selectedIds: Array.from(this.selectedParcels),
    });
  }

  // Pagination methods
  onPageSizeChange(newPageSize: number): void {
    this.pageSizeChange.emit(newPageSize);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Utility methods
  getStatusConfig(status: ParcelStatus) {
    return (
      this.statusConfig[status] || this.statusConfig[ParcelStatus.PROCESSING]
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
      month: 'short',
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

  trackByParcelId(index: number, parcel: Parcel): string {
    return parcel.id;
  }
}
