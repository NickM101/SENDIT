// src/app/admin/pickup-points/pickup-point-view/pickup-point-view.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PickupPoint } from '../../../../../core/models/pickup-point.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { PickupPointService } from '../../services/pickup-point.service';


@Component({
  selector: 'app-pickup-point-view',
  templateUrl: './pickup-point-view.component.html',
  standalone: true,
  imports: [SharedModule],
})
export class PickupPointViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pickupPointService = inject(PickupPointService);
  private toastr = inject(ToastService);

  pickupPoint: PickupPoint | null = null;
  isLoading = true;
  pickupPointId!: string;

  ngOnInit(): void {
    this.pickupPointId = this.route.snapshot.params['id'];
    this.loadPickupPoint();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPickupPoint(): void {
    this.isLoading = true;

    this.pickupPointService
      .getPickupPointById(this.pickupPointId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pickupPoint) => {
          this.pickupPoint = pickupPoint;
        },
        error: (error) => {
          console.error('Error loading pickup point:', error);
          this.toastr.error('Failed to load pickup point details', 'Error');
          this.router.navigate(['/dashboard/admin/pickup-point']);
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  onEdit(): void {
    this.router.navigate([
      '/dashboard/admin/pickup-point',
      this.pickupPointId,
      'edit',
    ]);
  }

  onDelete(): void {
    if (!this.pickupPoint) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${this.pickupPoint.name}"?`
    );
    if (!confirmDelete) return;

    this.pickupPointService
      .deletePickupPoint(this.pickupPointId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Pickup point deleted successfully', 'Success');
          this.router.navigate(['/dashboard/admin/pickup-point']);
        },
        error: (error) => {
          console.error('Error deleting pickup point:', error);
          this.toastr.error('Failed to delete pickup point', 'Error');
        },
      });
  }

  onToggleStatus(): void {
    if (!this.pickupPoint) return;

    const newStatus = !this.pickupPoint.isActive;

    this.pickupPointService
      .togglePickupPointStatus(this.pickupPointId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPoint) => {
          this.pickupPoint = updatedPoint;
          const status = newStatus ? 'activated' : 'deactivated';
          this.toastr.success(`Pickup point ${status} successfully`, 'Success');
        },
        error: (error) => {
          console.error('Error updating pickup point status:', error);
          this.toastr.error('Failed to update status', 'Error');
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/dashboard/admin/pickup-point']);
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }

  openInMaps(): void {
    if (!this.pickupPoint) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${this.pickupPoint.latitude},${this.pickupPoint.longitude}`;
    window.open(url, '_blank');
  }

  copyCoordinates(): void {
    if (!this.pickupPoint) return;

    const coordinates = `${this.pickupPoint.latitude}, ${this.pickupPoint.longitude}`;
    navigator.clipboard
      .writeText(coordinates)
      .then(() => {
        this.toastr.success('Coordinates copied to clipboard', 'Success');
      })
      .catch(() => {
        this.toastr.error('Failed to copy coordinates', 'Error');
      });
  }

  callPhone(): void {
    if (!this.pickupPoint?.phone) return;
    window.open(`tel:${this.pickupPoint.phone}`);
  }

  sendEmail(): void {
    if (!this.pickupPoint?.email) return;
    window.open(`mailto:${this.pickupPoint.email}`);
  }
}
