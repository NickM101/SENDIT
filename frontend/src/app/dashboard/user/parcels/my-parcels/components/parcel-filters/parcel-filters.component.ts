// src/app/dashboard/user/parcels/my-parcels/components/parcel-filters/parcel-filters.component.ts
import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SharedModule } from '../../../../../../shared/shared.module';
import { ParcelFilters, ParcelStatus, PackageType, DeliveryType } from '../../../../../../core/models/parcel.model';

@Component({
  selector: 'app-parcel-filters',
  templateUrl: './parcel-filters.component.html',
  imports: [SharedModule],
})
export class ParcelFiltersComponent implements OnInit {
  @Input() loading: boolean = false;

  @Output() filtersChange = new EventEmitter<ParcelFilters>();

  filterForm: FormGroup;
  showAdvancedFilters = false;

  // Enum options for dropdowns
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: ParcelStatus.PROCESSING, label: 'Processing' },
    { value: ParcelStatus.PICKED_UP, label: 'Picked Up' },
    { value: ParcelStatus.IN_TRANSIT, label: 'In Transit' },
    { value: ParcelStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
    { value: ParcelStatus.DELIVERED, label: 'Delivered' },
    { value: ParcelStatus.DELAYED, label: 'Delayed' },
    { value: ParcelStatus.CANCELLED, label: 'Cancelled' },
  ];

  packageTypeOptions = [
    { value: '', label: 'All Package Types' },
    { value: PackageType.STANDARD_BOX, label: 'Standard Box' },
    { value: PackageType.DOCUMENT, label: 'Document' },
    { value: PackageType.CLOTHING, label: 'Clothing' },
    { value: PackageType.ELECTRONICS, label: 'Electronics' },
    { value: PackageType.FRAGILE, label: 'Fragile' },
    { value: PackageType.LIQUID, label: 'Liquid' },
    { value: PackageType.PERISHABLE, label: 'Perishable' },
  ];

  deliveryTypeOptions = [
    { value: '', label: 'All Delivery Types' },
    { value: DeliveryType.STANDARD, label: 'Standard' },
    { value: DeliveryType.EXPRESS, label: 'Express' },
    { value: DeliveryType.SAME_DAY, label: 'Same Day' },
    { value: DeliveryType.OVERNIGHT, label: 'Overnight' },
  ];

  // Quick filter presets
  quickFilters = [
    { label: 'All', filters: {} },
    { label: 'Active', filters: { status: ParcelStatus.IN_TRANSIT } },
    { label: 'Delivered', filters: { status: ParcelStatus.DELIVERED } },
    { label: 'Pending', filters: { status: ParcelStatus.PROCESSING } },
    {
      label: 'This Week',
      filters: { startDate: this.getWeekStart(), endDate: new Date() },
    },
    {
      label: 'This Month',
      filters: { startDate: this.getMonthStart(), endDate: new Date() },
    },
  ];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to form changes with debounce
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((values) => {
        this.emitFilters(values);
      });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      search: [''],
      status: [''],
      packageType: [''],
      deliveryType: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  private emitFilters(formValues: any): void {
    const filters: ParcelFilters = {};

    if (formValues.search?.trim()) {
      filters.search = formValues.search.trim();
    }

    if (formValues.status) {
      filters.status = formValues.status as ParcelStatus;
    }

    if (formValues.packageType) {
      filters.packageType = formValues.packageType as PackageType;
    }

    if (formValues.deliveryType) {
      filters.deliveryType = formValues.deliveryType as DeliveryType;
    }

    if (formValues.startDate) {
      filters.startDate = new Date(formValues.startDate);
    }

    if (formValues.endDate) {
      filters.endDate = new Date(formValues.endDate);
    }

    this.filtersChange.emit(filters);
  }

  applyQuickFilter(quickFilter: any): void {
    const filters = quickFilter.filters;

    this.filterForm.patchValue({
      search: '',
      status: filters.status || '',
      packageType: filters.packageType || '',
      deliveryType: filters.deliveryType || '',
      startDate: filters.startDate
        ? this.formatDateForInput(filters.startDate)
        : '',
      endDate: filters.endDate ? this.formatDateForInput(filters.endDate) : '',
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.showAdvancedFilters = false;
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Getter for template
  get hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return !!(
      values.search ||
      values.status ||
      values.packageType ||
      values.deliveryType ||
      values.startDate ||
      values.endDate
    );
  }
}
