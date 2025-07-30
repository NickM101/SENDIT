// src/app/admin/pages/parcels/components/parcel-filters/parcel-filters.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { ParcelFilters, ParcelStatus, PackageType, DeliveryType } from '../../../../../core/models/parcel.model';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-parcel-filters',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './parcel-filters.component.html'
})
export class ParcelFiltersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  @Input() filters: ParcelFilters = {};
  @Input() searchForm!: FormGroup;
  @Output() filtersChange = new EventEmitter<ParcelFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  // Show/hide advanced filters
  showAdvancedFilters = false;

  // Enum options for dropdowns
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: ParcelStatus.PROCESSING, label: 'Processing' },
    { value: ParcelStatus.PAYMENT_PENDING, label: 'Payment Pending' },
    { value: ParcelStatus.PAYMENT_CONFIRMED, label: 'Payment Confirmed' },
    { value: ParcelStatus.PICKED_UP, label: 'Picked Up' },
    { value: ParcelStatus.IN_TRANSIT, label: 'In Transit' },
    { value: ParcelStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
    { value: ParcelStatus.DELIVERED, label: 'Delivered' },
    { value: ParcelStatus.DELAYED, label: 'Delayed' },
    { value: ParcelStatus.RETURNED, label: 'Returned' },
    { value: ParcelStatus.CANCELLED, label: 'Cancelled' }
  ];

  packageTypeOptions = [
    { value: '', label: 'All Package Types' },
    { value: PackageType.STANDARD_BOX, label: 'Standard Box' },
    { value: PackageType.DOCUMENT, label: 'Document' },
    { value: PackageType.CLOTHING, label: 'Clothing' },
    { value: PackageType.ELECTRONICS, label: 'Electronics' },
    { value: PackageType.FRAGILE, label: 'Fragile' },
    { value: PackageType.LIQUID, label: 'Liquid' },
    { value: PackageType.PERISHABLE, label: 'Perishable' }
  ];

  deliveryTypeOptions = [
    { value: '', label: 'All Delivery Types' },
    { value: DeliveryType.STANDARD, label: 'Standard' },
    { value: DeliveryType.EXPRESS, label: 'Express' },
    { value: DeliveryType.SAME_DAY, label: 'Same Day' },
    { value: DeliveryType.OVERNIGHT, label: 'Overnight' }
  ];

  // Quick filter buttons
  quickFilters = [
    { label: 'Pending Assignment', status: [ParcelStatus.PAYMENT_CONFIRMED, ParcelStatus.PROCESSING] },
    { label: 'In Transit', status: [ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY] },
    { label: 'Delivered Today', status: [ParcelStatus.DELIVERED], isToday: true },
    { label: 'Delayed', status: [ParcelStatus.DELAYED] }
  ];

  ngOnInit(): void {
    this.checkAdvancedFiltersState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAdvancedFiltersState(): void {
    const form = this.searchForm.value;
    this.showAdvancedFilters = !!(
      form.startDate || 
      form.endDate || 
      form.packageType || 
      form.deliveryType
    );
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onQuickFilter(quickFilter: any): void {
    const filters: ParcelFilters = {
      status: quickFilter.status.length === 1 ? quickFilter.status[0] : undefined
    };

    if (quickFilter.isToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filters.startDate = today;
      filters.endDate = tomorrow;
    }

    // Update form and emit changes
    this.searchForm.patchValue({
      status: filters.status || '',
      startDate: filters.startDate ? this.formatDateForInput(filters.startDate) : '',
      endDate: filters.endDate ? this.formatDateForInput(filters.endDate) : ''
    });

    this.filtersChange.emit(filters);
  }

  onClearFilters(): void {
    this.showAdvancedFilters = false;
    this.clearFilters.emit();
  }

  onApplyDateFilter(): void {
    const form = this.searchForm.value;
    const filters: ParcelFilters = {};

    if (form.startDate) {
      filters.startDate = new Date(form.startDate);
    }
    if (form.endDate) {
      filters.endDate = new Date(form.endDate);
    }

    this.filtersChange.emit(filters);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  get hasActiveFilters(): boolean {
    const form = this.searchForm.value;
    return !!(
      form.search ||
      form.status ||
      form.startDate ||
      form.endDate ||
      form.packageType ||
      form.deliveryType
    );
  }

  get activeFiltersCount(): number {
    const form = this.searchForm.value;
    let count = 0;
    
    if (form.search) count++;
    if (form.status) count++;
    if (form.startDate) count++;
    if (form.endDate) count++;
    if (form.packageType) count++;
    if (form.deliveryType) count++;
    
    return count;
  }
}