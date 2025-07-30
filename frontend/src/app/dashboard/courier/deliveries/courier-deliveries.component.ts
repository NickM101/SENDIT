// src/app/dashboard/courier/deliveries/courier-deliveries.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  startWith,
  map,
} from 'rxjs/operators';

import {
  CourierDeliveryService,
  CourierDelivery,
  DeliveryFilters,
} from '../services/courier-delivery.service';
import { ToastService } from '../../../core/services/toast.service';
import { SharedModule } from '../../../shared/shared.module';
import { PickupPointService } from '../../admin/pickup-points/services/pickup-point.service';

@Component({
  selector: 'app-courier-deliveries',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './courier-deliveries.component.html',
})
export class CourierDeliveriesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form controls
  searchControl = new FormControl('');
  statusFilterControl = new FormControl('');
  typeFilterControl = new FormControl('');

  // Data observables
  deliveries$!: Observable<CourierDelivery[]>;
  loading$!: Observable<boolean>;

  // Local state
  filteredDeliveries$ = new BehaviorSubject<CourierDelivery[]>([]);
  selectedDelivery: CourierDelivery | null = null;
  showFilters = false;
  currentLocation: { lat: number; lng: number } | null = null;

  // Stats
  todayStats = {
    total: 0,
    completed: 0,
    pending: 0,
    earnings: 0,
  };

  constructor(
    private courierDeliveryService: CourierDeliveryService,
    private locationService: PickupPointService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize observables after service is available
    this.deliveries$ = this.courierDeliveryService.deliveries$;
    this.loading$ = this.courierDeliveryService.loading$;

    this.initializeComponent();
    this.setupFilters();
    this.loadDeliveries();
    this.getCurrentLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Setup reactive filters
    this.setupFilters();

    // Calculate stats when deliveries change
    this.deliveries$.pipe(takeUntil(this.destroy$)).subscribe((deliveries) => {
      this.calculateTodayStats(deliveries);
    });
  }

  private setupFilters(): void {
    // Combine all filter controls and deliveries to create filtered results
    combineLatest([
      this.deliveries$,
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.statusFilterControl.valueChanges.pipe(startWith('')),
      this.typeFilterControl.valueChanges.pipe(startWith('')),
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([deliveries, search, status, type]) => {
          return this.filterDeliveries(deliveries, {
            search: search ?? undefined,
            status: status ?? undefined,
            type: type ?? undefined,
          });
        })
      )
      .subscribe((filteredDeliveries) => {
        this.filteredDeliveries$.next(filteredDeliveries);
      });
  }

  private filterDeliveries(
    deliveries: CourierDelivery[],
    filters: { search?: string; status?: string; type?: string }
  ): CourierDelivery[] {
    let filtered = [...deliveries];

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (delivery) =>
          delivery.trackingNumber.toLowerCase().includes(searchTerm) ||
          delivery.recipient.name.toLowerCase().includes(searchTerm) ||
          delivery.recipientAddress.city.toLowerCase().includes(searchTerm) ||
          delivery.description.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status && filters.status.trim()) {
      filtered = filtered.filter(
        (delivery) => delivery.status === filters.status
      );
    }

    // Type filter (pickup vs delivery)
    if (filters.type && filters.type.trim()) {
      if (filters.type === 'PICKUP') {
        filtered = filtered.filter(
          (delivery) =>
            delivery.status === 'PROCESSING' || delivery.status === 'PICKED_UP'
        );
      } else if (filters.type === 'DELIVERY') {
        filtered = filtered.filter(
          (delivery) =>
            delivery.status === 'IN_TRANSIT' ||
            delivery.status === 'OUT_FOR_DELIVERY' ||
            delivery.status === 'DELIVERED'
        );
      }
    }

    // Sort by priority and scheduled time
    return filtered.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by estimated delivery time
      if (a.estimatedDelivery && b.estimatedDelivery) {
        return (
          new Date(a.estimatedDelivery).getTime() -
          new Date(b.estimatedDelivery).getTime()
        );
      }

      return 0;
    });
  }

  private loadDeliveries(): void {
    this.courierDeliveryService.getMyDeliveries().subscribe({
      next: (deliveries) => {
        console.log('Loaded deliveries:', deliveries.length);
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
        this.toastService.error('Failed to load deliveries');
      },
    });
  }
  private isWithinKenya(lat: number, lng: number): boolean {
    return lat >= -4.89 && lat <= 5.89 && lng >= 33.89 && lng <= 41.89;
  }
  private getCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Check if location is within Kenya bounds
        if (this.isWithinKenya(lat, lng)) {
          this.currentLocation = { lat, lng };
        } else {
          console.warn('🌍 Current location outside Kenya');
          // You could show a toast here
        }
      },
      (error) => {
        console.error('🌍 Error getting location:', error);
        this.toastService.error('Failed to get current location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  private calculateTodayStats(deliveries: CourierDelivery[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = deliveries.filter((delivery) => {
      const deliveryDate = delivery.estimatedDelivery
        ? new Date(delivery.estimatedDelivery)
        : new Date(delivery.createdAt);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate.getTime() === today.getTime();
    });

    this.todayStats = {
      total: todayDeliveries.length,
      completed: todayDeliveries.filter((d) => d.status === 'DELIVERED').length,
      pending: todayDeliveries.filter(
        (d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED'
      ).length,
      earnings: todayDeliveries
        .filter((d) => d.status === 'DELIVERED')
        .reduce((sum, d) => sum + (d.estimatedEarnings || 0), 0),
    };
  }

  // Public methods for template
  onDeliveryClick(delivery: CourierDelivery): void {
    this.selectedDelivery = delivery;
    this.router.navigate(['/dashboard/courier/deliveries', delivery.id]);
  }

  onStatusUpdate(delivery: CourierDelivery, newStatus: string): void {
    if (!this.currentLocation) {
      this.toastService.error('Location access required for status updates');
      return;
    }

    this.courierDeliveryService
      .updateDeliveryStatus({
        parcelId: delivery.id,
        status: newStatus,
        latitude: this.currentLocation.lat,
        longitude: this.currentLocation.lng,
        description: `Status updated to ${newStatus}`,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Status updated successfully');
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.toastService.error('Failed to update status');
        },
      });
  }

  onMarkAsPickedUp(delivery: CourierDelivery): void {
    this.courierDeliveryService
      .markAsPickedUp(delivery.id, this.currentLocation || undefined)
      .subscribe({
        next: () => {
          this.toastService.success('Package marked as picked up');
        },
        error: (error) => {
          console.error('Error marking as picked up:', error);
          this.toastService.error('Failed to mark as picked up');
        },
      });
  }

  onNavigateToAddress(delivery: CourierDelivery): void {
    const address = delivery.recipientAddress;
    const query = encodeURIComponent(
      `${address.street}, ${address.area}, ${address.city}, ${address.county}`
    );

    // Try to open in Google Maps app, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(googleMapsUrl, '_blank');
  }

  onCallRecipient(delivery: CourierDelivery): void {
    const phoneNumber = delivery.recipient.phone;
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      this.toastService.error('No phone number available');
    }
  }

  onRefresh(): void {
    this.courierDeliveryService.refreshDeliveries();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilterControl.setValue('');
    this.typeFilterControl.setValue('');
    this.showFilters = false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'DELIVERED':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'PICKED_UP':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'DELAYED':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'PROCESSING':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'LOW':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  }

  getDeliveryTypeIcon(type: string): string {
    switch (type) {
      case 'EXPRESS':
        return 'zap';
      case 'SAME_DAY':
        return 'clock';
      case 'OVERNIGHT':
        return 'moon';
      default:
        return 'truck';
    }
  }

  canUpdateStatus(delivery: CourierDelivery): boolean {
    return (
      delivery.status !== 'DELIVERED' &&
      delivery.status !== 'CANCELLED' &&
      delivery.courierAssignment?.status === 'ACTIVE'
    );
  }

  getNextStatusOptions(
    delivery: CourierDelivery
  ): Array<{ value: string; label: string }> {
    switch (delivery.status) {
      case 'PROCESSING':
        return [{ value: 'PICKED_UP', label: 'Mark as Picked Up' }];
      case 'PICKED_UP':
        return [
          { value: 'IN_TRANSIT', label: 'Mark as In Transit' },
          { value: 'DELAYED', label: 'Mark as Delayed' },
        ];
      case 'IN_TRANSIT':
        return [
          { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
          { value: 'DELAYED', label: 'Mark as Delayed' },
        ];
      case 'OUT_FOR_DELIVERY':
        return [
          { value: 'DELIVERED', label: 'Mark as Delivered' },
          { value: 'DELAYED', label: 'Failed Delivery' },
        ];
      default:
        return [];
    }
  }

  trackByDelivery(index: number, delivery: CourierDelivery): string {
    return delivery.id;
  }
}
