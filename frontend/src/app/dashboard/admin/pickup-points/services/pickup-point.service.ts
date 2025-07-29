// src/app/admin/pickup-points/services/pickup-point.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import {
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';

import { ApiService } from '../../../../core/services/api.service';
import {
  QueryParams,
  PaginatedResponse,
} from '../../../../shared/models/api.model';
import { CreatePickupPointDto, PickupPoint, PickupPointQueryDto, UpdatePickupPointDto } from '../../../../core/models/pickup-point.model';


export interface PickupPointStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
  byCounty: Record<string, number>;
  averageRating: number;
}

@Injectable({
  providedIn: 'root',
})
export class PickupPointService {
  private readonly endpoint = '/pickup-points';
  private api = inject(ApiService);

  // Cache for frequently accessed data
  private _pickupPointsCache = new BehaviorSubject<PickupPoint[]>([]);
  private _statsCache = new BehaviorSubject<PickupPointStats | null>(null);
  private _lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public pickupPoints$ = this._pickupPointsCache.asObservable();
  public stats$ = this._statsCache.asObservable();

  constructor() {}

  /** Get Pickup Points (with filters, pagination, sorting) */
  getPickupPoints(
    params?: PickupPointQueryDto
  ): Observable<PaginatedResponse<PickupPoint>> {
    return this.api
      .getPaginated<PickupPoint>(this.endpoint, 'items', params)
      .pipe(
        tap((response) => {
          // Update cache if this is a full fetch (no filters)
          if (!params || Object.keys(params).length === 0) {
            this._pickupPointsCache.next(response.items);
            this._lastFetchTime = Date.now();
          }
        }),
        catchError(this.handleError)
      );
  }

  /** Get a Pickup Point by ID */
  getPickupPointById(id: string): Observable<PickupPoint> {
    return this.api
      .get<PickupPoint>(`${this.endpoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** Create Pickup Point */
  createPickupPoint(payload: CreatePickupPointDto): Observable<PickupPoint> {
    return this.api.post<PickupPoint>(this.endpoint, payload).pipe(
      tap((newPoint) => {
        // Update cache
        const currentPoints = this._pickupPointsCache.value;
        this._pickupPointsCache.next([...currentPoints, newPoint]);
        this.invalidateStats();
      }),
      catchError(this.handleError)
    );
  }

  /** Update Pickup Point */
  updatePickupPoint(
    id: string,
    payload: UpdatePickupPointDto
  ): Observable<PickupPoint> {
    return this.api.put<PickupPoint>(`${this.endpoint}/${id}`, payload).pipe(
      tap((updatedPoint) => {
        // Update cache
        const currentPoints = this._pickupPointsCache.value;
        const index = currentPoints.findIndex((p) => p.id === id);
        if (index !== -1) {
          const newPoints = [...currentPoints];
          newPoints[index] = updatedPoint;
          this._pickupPointsCache.next(newPoints);
        }
        this.invalidateStats();
      }),
      catchError(this.handleError)
    );
  }

  /** Delete Pickup Point */
  deletePickupPoint(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        // Update cache
        const currentPoints = this._pickupPointsCache.value;
        const filteredPoints = currentPoints.filter((p) => p.id !== id);
        this._pickupPointsCache.next(filteredPoints);
        this.invalidateStats();
      }),
      catchError(this.handleError)
    );
  }

  /** Bulk delete pickup points */
  bulkDeletePickupPoints(ids: string[]): Observable<void> {
    const params = new HttpParams().set('ids', ids.join(','));
    return this.api.delete<void>(`${this.endpoint}/bulk`, { params }).pipe(
      tap(() => {
        // Update cache
        const currentPoints = this._pickupPointsCache.value;
        const filteredPoints = currentPoints.filter((p) => !ids.includes(p.id));
        this._pickupPointsCache.next(filteredPoints);
        this.invalidateStats();
      }),
      catchError(this.handleError)
    );
  }

  /** Toggle pickup point status */
  togglePickupPointStatus(
    id: string,
    isActive: boolean
  ): Observable<PickupPoint> {
    return this.updatePickupPoint(id, { isActive });
  }

  /** Get pickup point statistics */
  getPickupPointStats(): Observable<PickupPointStats> {
    const cached = this._statsCache.value;
    const now = Date.now();

    // Return cached data if still valid
    if (cached && now - this._lastFetchTime < this.CACHE_DURATION) {
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.api.get<PickupPointStats>(`${this.endpoint}/stats`).pipe(
      tap((stats) => {
        this._statsCache.next(stats);
      }),
      catchError(this.handleError)
    );
  }

  /** Search pickup points */
  searchPickupPoints(
    query: string,
    limit: number = 10
  ): Observable<PickupPoint[]> {
    const params: QueryParams = {
      search: query,
      limit: limit,
    };

    return this.api
      .get<PickupPoint[]>(`${this.endpoint}/search`, params)
      .pipe(catchError(this.handleError));
  }

  /** Get nearby pickup points */
  getNearbyPickupPoints(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Observable<PickupPoint[]> {
    const queryParams: QueryParams = {
      lat: latitude,
      lng: longitude,
      radius: radius,
    };

    return this.api
      .get<PickupPoint[]>(`${this.endpoint}/nearby`, queryParams)
      .pipe(catchError(this.handleError));
  }

  /** Export pickup points data */
  exportPickupPoints(
    format: 'csv' | 'excel' = 'csv',
    filters?: PickupPointQueryDto
  ): Observable<Blob> {
    let queryParams: QueryParams = { format };

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams[key] = value;
        }
      });
    }

    const httpParams = new HttpParams({
      fromObject: queryParams as Record<string, string>,
    });

    return this.api['http']
      .get<Blob>(`${this.endpoint}/export`, {
        params: httpParams,
        responseType: 'blob' as 'json', // Angular expects this cast
      })
      .pipe(catchError(this.handleError));
  }

  /** Import pickup points from file */
  importPickupPoints(
    file: File
  ): Observable<{ success: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api
      .post<{ success: number; errors: any[] }>(
        `${this.endpoint}/import`,
        formData
      )
      .pipe(
        tap(() => {
          // Invalidate cache to force refresh
          this.invalidateCache();
        }),
        catchError(this.handleError)
      );
  }

  /** Validate pickup point data */
  validatePickupPoint(
    data: Partial<PickupPoint>
  ): Observable<{ isValid: boolean; errors: string[] }> {
    return this.api
      .post<{ isValid: boolean; errors: string[] }>(
        `${this.endpoint}/validate`,
        data
      )
      .pipe(catchError(this.handleError));
  }

  /** Get pickup points for dropdown/select components */
  getPickupPointsForSelect(): Observable<
    { id: string; name: string; city: string }[]
  > {
    return this.api
      .get<{ id: string; name: string; city: string }[]>(
        `${this.endpoint}/select`
      )
      .pipe(catchError(this.handleError));
  }

  /** Clear all caches */
  invalidateCache(): void {
    this._pickupPointsCache.next([]);
    this._statsCache.next(null);
    this._lastFetchTime = 0;
  }

  /** Clear stats cache */
  private invalidateStats(): void {
    this._statsCache.next(null);
  }

  /** Handle HTTP errors */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message ||
        `Server Error: ${error.status} ${error.statusText}`;
    }

    console.error('PickupPointService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };

  /** Get cached pickup points */
  getCachedPickupPoints(): PickupPoint[] {
    return this._pickupPointsCache.value;
  }

  /** Check if cache is valid */
  isCacheValid(): boolean {
    return Date.now() - this._lastFetchTime < this.CACHE_DURATION;
  }
}
