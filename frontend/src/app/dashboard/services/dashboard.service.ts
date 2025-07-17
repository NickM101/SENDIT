// File: src/app/dashboard/services/dashboard.service.ts
// Dashboard service for SendIT application

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DashboardStats,
  RecentParcel,
  NotificationItem,
  DeliveryLocation,
  TrackingUpdate,
  DashboardPreferences,
  DashboardFilter,
  ActivityFeed,
  ChartData,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}`;
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private preferencesSubject = new BehaviorSubject<DashboardPreferences | null>(
    null
  );

  public stats$ = this.statsSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  /**
   * Load initial dashboard data
   */
  private loadInitialData(): void {
    this.getDashboardStats().subscribe();
    this.getNotifications().subscribe();
    this.getUserPreferences().subscribe();
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(
      tap((stats) => this.statsSubject.next(stats)),
      shareReplay(1),
      catchError(this.handleError<DashboardStats>('getDashboardStats'))
    );
  }

  /**
   * Get recent parcels
   */
  getRecentParcels(limit: number = 5): Observable<RecentParcel[]> {
    return this.http
      .get<RecentParcel[]>(`${this.apiUrl}/dashboard/recent-parcels`, {
        params: { limit: limit.toString() },
      })
      .pipe(
        shareReplay(1),
        catchError(this.handleError<RecentParcel[]>('getRecentParcels', []))
      );
  }

  /**
   * Get user notifications
   */
  getNotifications(): Observable<NotificationItem[]> {
    return this.http
      .get<NotificationItem[]>(`${this.apiUrl}/dashboard/notifications`)
      .pipe(
        tap((notifications) => this.notificationsSubject.next(notifications)),
        shareReplay(1),
        catchError(this.handleError<NotificationItem[]>('getNotifications', []))
      );
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/dashboard/notifications/${notificationId}/read`,
        {}
      )
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(
            (notification) =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
          );
          this.notificationsSubject.next(updatedNotifications);
        }),
        catchError(this.handleError('markNotificationAsRead'))
      );
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/dashboard/notifications`).pipe(
      tap(() => this.notificationsSubject.next([])),
      catchError(this.handleError('clearAllNotifications'))
    );
  }

  /**
   * Get delivery locations
   */
  getDeliveryLocations(): Observable<DeliveryLocation[]> {
    return this.http
      .get<DeliveryLocation[]>(`${this.apiUrl}/dashboard/delivery-locations`)
      .pipe(
        shareReplay(1),
        catchError(
          this.handleError<DeliveryLocation[]>('getDeliveryLocations', [])
        )
      );
  }

  /**
   * Get activity feed
   */
  getActivityFeed(limit: number = 10): Observable<ActivityFeed[]> {
    return this.http
      .get<ActivityFeed[]>(`${this.apiUrl}/dashboard/activity`, {
        params: { limit: limit.toString() },
      })
      .pipe(
        shareReplay(1),
        catchError(this.handleError<ActivityFeed[]>('getActivityFeed', []))
      );
  }

  /**
   * Get chart data for parcels over time
   */
  getParcelChartData(
    period: 'week' | 'month' | 'year' = 'month'
  ): Observable<ChartData> {
    return this.http
      .get<ChartData>(`${this.apiUrl}/dashboard/charts/parcels`, {
        params: { period },
      })
      .pipe(
        shareReplay(1),
        catchError(this.handleError<ChartData>('getParcelChartData'))
      );
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): Observable<DashboardPreferences> {
    return this.http
      .get<DashboardPreferences>(`${this.apiUrl}/dashboard/preferences`)
      .pipe(
        tap((preferences) => this.preferencesSubject.next(preferences)),
        shareReplay(1),
        catchError(this.handleError<DashboardPreferences>('getUserPreferences'))
      );
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(
    preferences: Partial<DashboardPreferences>
  ): Observable<DashboardPreferences> {
    return this.http
      .patch<DashboardPreferences>(
        `${this.apiUrl}/dashboard/preferences`,
        preferences
      )
      .pipe(
        tap((updatedPreferences) =>
          this.preferencesSubject.next(updatedPreferences)
        ),
        catchError(
          this.handleError<DashboardPreferences>('updateUserPreferences')
        )
      );
  }

  /**
   * Search parcels
   */
  searchParcels(query: string): Observable<RecentParcel[]> {
    return this.http
      .get<RecentParcel[]>(`${this.apiUrl}/dashboard/search`, {
        params: { q: query },
      })
      .pipe(catchError(this.handleError<RecentParcel[]>('searchParcels', [])));
  }

  /**
   * Get filtered parcels
   */
  getFilteredParcels(filter: DashboardFilter): Observable<RecentParcel[]> {
    return this.http
      .post<RecentParcel[]>(`${this.apiUrl}/dashboard/filter`, filter)
      .pipe(
        catchError(this.handleError<RecentParcel[]>('getFilteredParcels', []))
      );
  }

  /**
   * Export parcel history
   */
  exportParcelHistory(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/dashboard/export`, {
        params: { format },
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError<Blob>('exportParcelHistory')));
  }

  /**
   * Get real-time tracking updates
   */
  getTrackingUpdates(): Observable<TrackingUpdate[]> {
    return this.http
      .get<TrackingUpdate[]>(`${this.apiUrl}/dashboard/tracking-updates`)
      .pipe(
        shareReplay(1),
        catchError(this.handleError<TrackingUpdate[]>('getTrackingUpdates', []))
      );
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): Observable<any> {
    return combineLatest([
      this.getDashboardStats(),
      this.getRecentParcels(),
      this.getNotifications(),
    ]).pipe(
      map(([stats, parcels, notifications]) => ({
        stats,
        parcels,
        notifications,
      }))
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount(): Observable<number> {
    return this.notifications$.pipe(
      map((notifications) => notifications.filter((n) => !n.read).length)
    );
  }

  /**
   * Handle HTTP operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Let the app keep running by returning an empty result
      return new Observable<T>((observer) => {
        if (result !== undefined) {
          observer.next(result as T);
        }
        observer.complete();
      });
    };
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Get status color class
   */
  getStatusColorClass(status: string): string {
    const statusColors: { [key: string]: string } = {
      PROCESSING: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
      OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      DELAYED: 'bg-orange-100 text-orange-800',
      RETURNED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }
}
