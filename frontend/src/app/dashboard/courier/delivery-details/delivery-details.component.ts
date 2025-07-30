// src/app/dashboard/courier/deliveries/components/delivery-details/delivery-details.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { ToastService } from '../../../core/services/toast.service';
import { SharedModule } from '../../../shared/shared.module';
import {
  CourierDelivery,
  CourierDeliveryService,
} from '../services/courier-delivery.service';
import { LocationService } from '../../../core/services/location.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PhotoCaptureComponent } from '../../../shared/components/photo-capture/photo-capture.component';

@Component({
  selector: 'app-delivery-details',
  standalone: true,
  imports: [SharedModule, ModalComponent, PhotoCaptureComponent],
  templateUrl: './delivery-details.component.html',
})
export class DeliveryDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  delivery: CourierDelivery | null = null;
  loading = false;
  showStatusModal = false;
  showPhotoModal = false;
  currentLocation: { lat: number; lng: number } | null = null;

  // Status update form
  statusUpdateForm = new FormGroup({
    status: new FormControl('', Validators.required),
    notes: new FormControl(''),
    location: new FormControl(''),
  });

  // Photo capture
  capturedPhoto: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courierDeliveryService: CourierDeliveryService,
    private locationService: LocationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryDetails();
    this.getCurrentLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDeliveryDetails(): void {
    this.loading = true;

    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const deliveryId = params['id'];
          return this.courierDeliveryService.getDeliveryById(deliveryId);
        })
      )
      .subscribe({
        next: (delivery) => {
          this.delivery = delivery;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading delivery details:', error);
          this.toastService.error('Failed to load delivery details');
          this.router.navigate(['/dashboard/courier/deliveries']);
          this.loading = false;
        },
      });
  }

  private getCurrentLocation(): void {
    this.locationService.getCurrentPosition().subscribe({
      next: (position) => {
        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      },
      error: (error) => {
        console.warn('Could not get current location:', error);
      },
    });
  }

  onStatusUpdate(): void {
    if (!this.delivery || !this.statusUpdateForm.valid) return;

    const formValue = this.statusUpdateForm.value;

    this.courierDeliveryService
      .updateDeliveryStatus({
        parcelId: this.delivery.id,
        status: formValue.status!,
        description: formValue.notes || undefined,
        latitude: this.currentLocation?.lat,
        longitude: this.currentLocation?.lng,
      })
      .subscribe({
        next: (updatedDelivery) => {
          this.delivery = updatedDelivery;
          this.showStatusModal = false;
          this.statusUpdateForm.reset();
          this.toastService.success('Status updated successfully');
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.toastService.error('Failed to update status');
        },
      });
  }

  onMarkAsDelivered(): void {
    if (!this.delivery) return;

    if (this.capturedPhoto) {
      this.courierDeliveryService
        .markAsDelivered(
          this.delivery.id,
          this.capturedPhoto,
          this.statusUpdateForm.get('notes')?.value || undefined,
          this.currentLocation || undefined
        )
        .subscribe({
          next: (updatedDelivery) => {
            this.delivery = updatedDelivery;
            this.showPhotoModal = false;
            this.capturedPhoto = null;
            this.photoPreview = null;
            this.toastService.success('Package marked as delivered');
          },
          error: (error) => {
            console.error('Error marking as delivered:', error);
            this.toastService.error('Failed to mark as delivered');
          },
        });
    } else {
      this.toastService.error('Photo proof required for delivery confirmation');
    }
  }

  onPhotoCapture(photo: File): void {
    this.capturedPhoto = photo;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(photo);
  }

  onNavigateToAddress(): void {
    if (!this.delivery) return;

    const address = this.delivery.recipientAddress;
    const query = encodeURIComponent(
      `${address.street}, ${address.area}, ${address.city}, ${address.county}`
    );

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(googleMapsUrl, '_blank');
  }

  onCallRecipient(): void {
    if (!this.delivery?.recipient.phone) {
      this.toastService.error('No phone number available');
      return;
    }

    window.open(`tel:${this.delivery.recipient.phone}`, '_self');
  }

  onCallSender(): void {
    if (!this.delivery?.sender.phone) {
      this.toastService.error('No phone number available');
      return;
    }

    window.open(`tel:${this.delivery.sender.phone}`, '_self');
  }

  openStatusModal(): void {
    this.showStatusModal = true;
    this.statusUpdateForm.patchValue({
      status: this.getNextStatus(),
      location: this.formatCurrentLocation(),
    });
  }

  openPhotoModal(): void {
    this.showPhotoModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.statusUpdateForm.reset();
  }

  closePhotoModal(): void {
    this.showPhotoModal = false;
    this.capturedPhoto = null;
    this.photoPreview = null;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/courier/deliveries']);
  }

  private getNextStatus(): string {
    if (!this.delivery) return '';

    switch (this.delivery.status) {
      case 'PROCESSING':
        return 'PICKED_UP';
      case 'PICKED_UP':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'OUT_FOR_DELIVERY';
      case 'OUT_FOR_DELIVERY':
        return 'DELIVERED';
      default:
        return '';
    }
  }

  private formatCurrentLocation(): string {
    if (!this.currentLocation) return '';
    return `${this.currentLocation.lat.toFixed(
      6
    )}, ${this.currentLocation.lng.toFixed(6)}`;
  }

  canUpdateStatus(): boolean {
    return (
      this.delivery?.status !== 'DELIVERED' &&
      this.delivery?.status !== 'CANCELLED' &&
      this.delivery?.courierAssignment?.status === 'ACTIVE'
    );
  }

  isDeliveryStatus(): boolean {
    return this.delivery?.status === 'OUT_FOR_DELIVERY';
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

  getPackageTypeIcon(type: string): string {
    switch (type) {
      case 'DOCUMENT':
        return 'file-text';
      case 'ELECTRONICS':
        return 'smartphone';
      case 'FRAGILE':
        return 'alert-triangle';
      case 'CLOTHING':
        return 'shirt';
      case 'LIQUID':
        return 'droplet';
      case 'PERISHABLE':
        return 'clock';
      default:
        return 'package';
    }
  }

  formatWeight(weight: number, unit: string): string {
    return `${weight} ${unit}`;
  }

  formatCurrency(amount: number, currency: string = 'KES'): string {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
