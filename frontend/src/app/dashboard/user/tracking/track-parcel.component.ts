// src/app/dashboard/user/tracking/track-parcel.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  TrackParcelService,
} from './services/track-parcel.service';
import { LoadingService } from '../../../core/services/loading.service';
import { SharedModule } from '../../../shared/shared.module';
import { ParcelDetails } from '../../../core/models/parcel.model';
import { TrackingDetailsComponent } from "./components/tracking-details/tracking-details.component";
import { TrackingTimelineComponent } from "./components/tracking-timeline/tracking-timeline.component";
import { DeliveryMapComponent } from "./components/delivery-map/delivery-map.component";
import { ParcelInfoCardComponent } from "./components/parcel-info-card/parcel-info-card.component";
import { QuickActionsComponent } from "./components/quick-actions/quick-actions.component";
import { RecentSearchesComponent } from "./components/recent-searches/recent-searches.component";

@Component({
  selector: 'app-track-parcel',
  templateUrl: './track-parcel.component.html',
  imports: [SharedModule, TrackingDetailsComponent, TrackingTimelineComponent, DeliveryMapComponent, ParcelInfoCardComponent, QuickActionsComponent, RecentSearchesComponent],
})
export class TrackParcelComponent implements OnInit, OnDestroy {
  trackingForm: FormGroup;
  currentParcel: ParcelDetails | null = null;
  isSearching = false;
  searchError = '';
  showDetails = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private trackParcelService: TrackParcelService,
    private loadingService: LoadingService,
    private route: ActivatedRoute
  ) {
    this.trackingForm = this.fb.group({
      trackingNumber: [
        '',
        [Validators.required, Validators.pattern(/^ST-\d{7,10}$/)],
      ],
    });
  }

  ngOnInit(): void {
    // Subscribe to current parcel updates
    this.trackParcelService.currentParcel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((parcel) => {
        this.currentParcel = parcel;
        this.showDetails = !!parcel;
      });

    // Check if tracking number is provided in route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['trackingNumber']) {
        this.trackingForm.patchValue({
          trackingNumber: params['trackingNumber'],
        });
        this.onTrackParcel();
      }
    });

    // Check if tracking number is provided in query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['track'] && !this.currentParcel) {
          this.trackingForm.patchValue({
            trackingNumber: params['track'],
          });
          this.onTrackParcel();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle form submission
   */
  onTrackParcel(): void {
    if (this.trackingForm.valid) {
      const trackingNumber = this.trackingForm
        .get('trackingNumber')
        ?.value?.trim();
      if (trackingNumber) {
        this.searchParcel(trackingNumber);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Search for parcel by tracking number
   */
  private searchParcel(trackingNumber: string): void {
    this.isSearching = true;
    this.searchError = '';
    this.loadingService.show();

    this.trackParcelService
      .trackParcel(trackingNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parcel) => {
          this.currentParcel = parcel;
          this.showDetails = true;
          this.isSearching = false;
          this.loadingService.hide();
        },
        error: (error) => {
          this.searchError =
            error.message ||
            'ParcelDetails not found. Please check your tracking number and try again.';
          this.currentParcel = null;
          this.showDetails = false;
          this.isSearching = false;
          this.loadingService.hide();
        },
      });
  }

  /**
   * Handle tracking number selection from recent searches
   */
  onTrackingNumberSelected(trackingNumber: string): void {
    this.trackingForm.patchValue({ trackingNumber });
    this.onTrackParcel();
  }

  /**
   * Clear search and reset form
   */
  onClearSearch(): void {
    this.trackingForm.reset();
    this.currentParcel = null;
    this.showDetails = false;
    this.searchError = '';
  }

  /**
   * Scan QR code (placeholder for future implementation)
   */
  onScanQRCode(): void {
    // TODO: Implement QR code scanning functionality
    console.log('QR Code scanning not implemented yet');
  }

  /**
   * Check if form field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.trackingForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.trackingForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Tracking number is required';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid tracking number (e.g., ST-2507923)';
      }
    }
    return '';
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.trackingForm.controls).forEach((key) => {
      const control = this.trackingForm.get(key);
      control?.markAsTouched();
    });
  }
}
