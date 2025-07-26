// src/app/dashboard/user/parcels/my-parcels/services/my-parcels.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ApiService } from '../../../../../core/services/api.service';
import { Parcel, ParcelStats, ParcelFilters, ParcelStatus } from '../../../../../core/models/parcel.model';
import { PaginatedResponse } from '../../../../../shared/models/api.model';


@Injectable({
  providedIn: 'root',
})
export class MyParcelsService {
  private parcelsSubject = new BehaviorSubject<Parcel[]>([]);
  private statsSubject = new BehaviorSubject<ParcelStats | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public parcels$ = this.parcelsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private currentPage = 1;
  private currentFilters: ParcelFilters = {};

  constructor(private apiService: ApiService) {}

  /**
   * Get user's parcels with pagination and filtering
   */
  getParcels(
    page: number = 1,
    limit: number = 10,
    filters?: ParcelFilters
  ): Observable<PaginatedResponse<Parcel>> {
    this.loadingSubject.next(true);
    this.currentPage = page;
    this.currentFilters = { ...filters };

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.search) {
      params = params.set('trackingNumber', filters.search);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.startDate) {
      params = params.set(
        'startDate',
        filters.startDate.toISOString().split('T')[0]
      );
    }
    if (filters?.endDate) {
      params = params.set(
        'endDate',
        filters.endDate.toISOString().split('T')[0]
      );
    }

    // Convert Date fields in filters to string before passing to API
    const queryFilters: Record<string, any> = { ...filters };
    if (filters?.startDate) {
      queryFilters['startDate'] = filters.startDate.toISOString().split('T')[0];
    }
    if (filters?.endDate) {
      queryFilters['endDate'] = filters.endDate.toISOString().split('T')[0];
    }

    return this.apiService
      .getPaginated<Parcel>('/parcels/my-parcels', 'parcels', {
        page,
        limit,
        ...queryFilters,
      })
      .pipe(
        tap((response) => {
          this.parcelsSubject.next(response.items);
          this.loadingSubject.next(false);
        }),
        map((response) => {
          const transformedItems = response.items.map((parcel) => ({
            ...parcel,
            createdAt: new Date(parcel.createdAt),
            estimatedDelivery: parcel.estimatedDelivery
              ? new Date(parcel.estimatedDelivery)
              : undefined,
            actualDelivery: parcel.actualDelivery
              ? new Date(parcel.actualDelivery)
              : undefined,
            // Add similar transformations for pickupDate, deliveryDate if needed in the Parcel model
          }));

          // Return the response with transformed items and original pagination
          return {
            ...response,
            items: transformedItems,
          };
        }),
        tap(() => {
          this.loadingSubject.next(false); // Set loading false after mapping
        }),
        catchError((error) => {
          this.loadingSubject.next(false); // Ensure loading is false even on error
          console.error('Error fetching parcels:', error);
          return throwError(error); // Re-throw the error
        })
      );
  }

  /**
   * Get parcel statistics
   */
  getParcelStats(): Observable<ParcelStats> {
    return this.apiService
      .get<ParcelStats>('/parcels/stats')
      .pipe(tap((stats) => this.statsSubject.next(stats)));
  }

  /**
   * Get parcel by tracking number
   */
  getParcelByTrackingNumber(trackingNumber: string): Observable<Parcel> {
    return this.apiService.get<Parcel>(`/parcels/track/${trackingNumber}`).pipe(
      map((parcel) => ({
        ...parcel,
        createdAt: new Date(parcel.createdAt),
        estimatedDelivery: parcel.estimatedDelivery
          ? new Date(parcel.estimatedDelivery)
          : undefined,
        actualDelivery: parcel.actualDelivery
          ? new Date(parcel.actualDelivery)
          : undefined,
      }))
    );
  }

  /**
   * Export parcels data
   */
  exportParcels(
    format: 'csv' | 'excel' = 'csv',
    filters?: ParcelFilters
  ): Observable<Blob> {
    const params: Record<string, any> = { format };

    if (filters?.status) {
      params['status'] = filters.status;
    }
    if (filters?.startDate) {
      params['startDate'] = filters.startDate.toISOString().split('T')[0];
    }
    if (filters?.endDate) {
      params['endDate'] = filters.endDate.toISOString().split('T')[0];
    }

    return this.apiService.get<Blob>('/parcels/export', params);
  }

  /**
   * Delete parcel (if allowed)
   */
  deleteParcel(parcelId: string): Observable<void> {
    return this.apiService.delete<void>(`/parcels/${parcelId}`).pipe(
      tap(() => {
        // Refresh current page
        this.getParcels(this.currentPage, 10, this.currentFilters).subscribe();
      })
    );
  }

  /**
   * Cancel parcel
   */
  cancelParcel(parcelId: string, reason?: string): Observable<void> {
    return this.apiService
      .patch<void>(`/parcels/${parcelId}/cancel`, { reason })
      .pipe(
        tap(() => {
          // Refresh current page
          this.getParcels(
            this.currentPage,
            10,
            this.currentFilters
          ).subscribe();
        })
      );
  }

  /**
   * Refresh parcels list
   */
  refreshParcels(): void {
    this.getParcels(this.currentPage, 10, this.currentFilters).subscribe();
  }

  /**
   * Get current parcels value
   */
  getCurrentParcels(): Parcel[] {
    return this.parcelsSubject.value;
  }

  /**
   * Get available parcel actions based on status
   */
  getParcelActions(
    parcel: Parcel
  ): Array<{
    label: string;
    action: string;
    icon: string;
    disabled?: boolean;
  }> {
    const actions = [
      { label: 'View Details', action: 'view', icon: 'eye' },
      { label: 'Track Parcel', action: 'track', icon: 'map-pin' },
    ];

    // Add conditional actions based on status
    if ([ParcelStatus.DRAFT, ParcelStatus.PROCESSING].includes(parcel.status)) {
      actions.push({ label: 'Edit', action: 'edit', icon: 'edit' });
      actions.push({ label: 'Cancel', action: 'cancel', icon: 'x-circle' });
    }

    if (parcel.status === ParcelStatus.DELIVERED) {
      actions.push({
        label: 'Download Receipt',
        action: 'receipt',
        icon: 'download',
      });
      actions.push({ label: 'Reorder', action: 'reorder', icon: 'repeat' });
    }

    return actions;
  }
}
