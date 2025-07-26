// src/app/dashboard/user/tracking/services/track-parcel.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ParcelDetails, RecentSearch } from '../../../../core/models/parcel.model';

@Injectable({
  providedIn: 'root',
})
export class TrackParcelService {
  private recentSearchesSubject = new BehaviorSubject<RecentSearch[]>([]);
  public recentSearches$ = this.recentSearchesSubject.asObservable();

  private currentParcelSubject = new BehaviorSubject<ParcelDetails | null>(
    null
  );
  public currentParcel$ = this.currentParcelSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {
    this.loadRecentSearches();
  }

  /**
   * Track parcel by tracking number
   */
  trackParcel(trackingNumber: string): Observable<ParcelDetails> {
    return this.apiService
      .get<ParcelDetails>(`/parcels/track/${trackingNumber}`)
      .pipe(
        tap((parcel) => {
          this.currentParcelSubject.next(parcel);
          this.addToRecentSearches(trackingNumber, parcel.status);
          this.toastService.success('ParcelDetails details retrieved successfully');
        }),
        map((parcel) => parcel)
      );
  }

  /**
   * Get parcel details by ID (for authenticated users)
   */
  getParcelById(parcelId: string): Observable<ParcelDetails> {
    return this.apiService.get<ParcelDetails>(`/parcels/${parcelId}`).pipe(
      tap((parcel) => {
        this.currentParcelSubject.next(parcel);
      })
    );
  }

  /**
   * Get live tracking updates for a parcel
   */
  getLiveTracking(parcelId: string): Observable<any> {
    return this.apiService.get(`/tracking/${parcelId}`);
  }

  /**
   * Search parcels with filters
   */
  searchParcels(query: {
    trackingNumber?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.apiService.get('/parcels/my-parcels', query);
  }

  /**
   * Add tracking number to recent searches
   */
  private addToRecentSearches(trackingNumber: string, status: string): void {
    const recentSearches = this.recentSearchesSubject.value;
    const existingIndex = recentSearches.findIndex(
      (s) => s.trackingNumber === trackingNumber
    );

    const newSearch: RecentSearch = {
      trackingNumber,
      searchedAt: new Date(),
      status,
    };

    if (existingIndex >= 0) {
      recentSearches[existingIndex] = newSearch;
    } else {
      recentSearches.unshift(newSearch);
    }

    // Keep only last 10 searches
    const updatedSearches = recentSearches.slice(0, 10);
    this.recentSearchesSubject.next(updatedSearches);
    this.saveRecentSearches(updatedSearches);
  }

  /**
   * Get recent searches from localStorage
   */
  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem('sendit_recent_searches');
      if (saved) {
        const searches = JSON.parse(saved).map((s: any) => ({
          ...s,
          searchedAt: new Date(s.searchedAt),
        }));
        this.recentSearchesSubject.next(searches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }

  /**
   * Save recent searches to localStorage
   */
  private saveRecentSearches(searches: RecentSearch[]): void {
    try {
      localStorage.setItem('sendit_recent_searches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.recentSearchesSubject.next([]);
    localStorage.removeItem('sendit_recent_searches');
  }

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      PROCESSING:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      PAYMENT_PENDING:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      PAYMENT_CONFIRMED:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      PICKED_UP:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      IN_TRANSIT:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      OUT_FOR_DELIVERY:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      DELIVERED:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      DELAYED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      RETURNED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
      statusColors[status] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    );
  }

  /**
   * Format status text
   */
  formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
