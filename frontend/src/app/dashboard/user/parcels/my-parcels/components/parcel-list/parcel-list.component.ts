// src/app/dashboard/user/parcels/my-parcels/components/parcel-list/parcel-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  DeliveryType,
  PackageType,
  Parcel,
  ParcelStatus,
} from '../../../../../../core/models/parcel.model';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ParcelCardComponent } from '../parcel-card/parcel-card.component';
import { ParcelActionsComponent } from '../parcel-actions/parcel-actions.component';

@Component({
  selector: 'app-parcel-list',
  templateUrl: './parcel-list.component.html',
  imports: [SharedModule, ParcelCardComponent, ParcelActionsComponent],
})
export class ParcelListComponent {
  @Input() parcels: Parcel[] = [];
  @Input() loading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() parcelAction = new EventEmitter<{ type: string; parcel: Parcel }>();
  @Output() refresh = new EventEmitter<void>();

  // View mode toggle
  viewMode: 'list' | 'grid' = 'grid';

  defaultParcel: Parcel = {
    id: '',
    trackingNumber: '',
    recipient: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
      },
      id: '',
    },
    sender: {
      name: '',
      email: '',
      phone: '',
      id: '',
    },
    description: '',
    weight: 0,
    weightUnit: '',
    currency: '',
    totalPrice: 0,
    packageType: PackageType.STANDARD_BOX,
    status: ParcelStatus.DRAFT,
    deliveryType: DeliveryType.STANDARD,
    createdAt: new Date(),
  };

  onParcelAction(type: string, parcel: Parcel): void {
    this.parcelAction.emit({ type, parcel });
  }

  onPageChange(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  trackByFn(index: number, item: Parcel): string {
    return item.id;
  }

  get startItem(): number {
    return (this.currentPage - 1) * 10 + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * 10, this.totalItems);
  }
}
