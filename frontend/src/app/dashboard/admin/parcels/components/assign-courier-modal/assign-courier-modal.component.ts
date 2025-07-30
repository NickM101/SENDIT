// src/app/admin/pages/parcels/components/assign-courier-modal/assign-courier-modal.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Courier } from '../../../../../core/models/courier.model';
import { Parcel } from '../../../../../core/models/parcel.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { CourierService } from '../../../../courier/services/courier.service';
import { ParcelService } from '../../../../services/parcel.service';
import { SharedModule } from '../../../../../shared/shared.module';


@Component({
  selector: 'app-assign-courier-modal',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './assign-courier-modal.component.html',
})
export class AssignCourierModalComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly courierService = inject(CourierService);
  private readonly parcelService = inject(ParcelService);
  private readonly toastService = inject(ToastService);

  @Input() parcel: Parcel | null = null;
  @Input() show = false;
  @Output() success = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  assignForm: FormGroup;
  couriers: Courier[] = [];
  loading = false;
  submitting = false;
  selectedCourier: Courier | null = null;

  constructor() {
    this.assignForm = this.fb.group({
      courierId: ['', Validators.required],
      instructions: [''],
      priority: ['NORMAL'],
      estimatedPickupTime: [''],
    });
  }

  ngOnInit(): void {
    if (this.show && this.parcel) {
      this.loadAvailableCouriers();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableCouriers(): void {
    if (!this.parcel) return;

    this.loading = true;

    const searchParams = {
      status: 'ACTIVE',
      location: {
        latitude: this.parcel.recipient.address.latitude,
        longitude: this.parcel.recipient.address.longitude,
      },
      maxDistance: 50, // 50km radius
      availableOnly: true,
    };

    this.courierService
      .getAvailableCouriers(searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.couriers = response?.sort((a, b) => {
            // Sort by availability and rating
            if (a.currentWorkload !== b.currentWorkload) {
              return a.currentWorkload - b.currentWorkload;
            }
            return b.rating - a.rating;
          }) ?? [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading couriers:', error);
          this.toastService.error('Failed to load available couriers');
          this.loading = false;
        },
      });
  }

  onCourierSelect(courier: Courier): void {
    this.selectedCourier = courier;
    this.assignForm.patchValue({ courierId: courier.id });
  }

  onSubmit(): void {
    if (this.assignForm.invalid || !this.parcel) return;

    this.submitting = true;
    const formData = this.assignForm.value;

    const assignmentData = {
      courierId: formData.courierId,
      instructions: formData.instructions,
      priority: formData.priority,
      estimatedPickupTime: formData.estimatedPickupTime
        ? new Date(formData.estimatedPickupTime)
        : undefined,
    };

    this.parcelService
      .assignCourier(this.parcel.id, assignmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Courier assigned successfully');
          this.success.emit();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error assigning courier:', error);
          this.toastService.error('Failed to assign courier');
          this.submitting = false;
        },
      });
  }

  onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.assignForm.reset();
    this.selectedCourier = null;
    this.submitting = false;
  }

  // Helper methods
  getCourierStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'BUSY':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getCourierStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'check-circle';
      case 'BUSY':
        return 'clock';
      case 'INACTIVE':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  getWorkloadPercentage(courier: Courier): number {
    return courier.maxCapacity > 0
      ? (courier.currentWorkload / courier.maxCapacity) * 100
      : 0;
  }

  getWorkloadColor(percentage: number): string {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('star-full');
    }

    if (hasHalfStar) {
      stars.push('star-half');
    }

    while (stars.length < 5) {
      stars.push('star-empty');
    }

    return stars;
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }
}
