// src/app/shared/services/courier.service.ts
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Courier,
  CourierSearchParams,
} from '../../../core/models/courier.model';

@Injectable({
  providedIn: 'root',
})
export class CourierService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = `/couriers`; // Note: no need for full URL since ApiService handles it

  getAvailableCouriers(
    searchParams: CourierSearchParams
  ): Observable<Courier[]> {
    // Convert location object to flat params
    let params: any = { ...searchParams };
    if (searchParams.location) {
      params.latitude = searchParams.location.latitude;
      params.longitude = searchParams.location.longitude;
      delete params.location; // Remove nested object
    }

    return this.apiService.get<Courier[]>(`${this.baseUrl}/available`, params);
  }

  getCourierById(courierId: string): Observable<Courier> {
    return this.apiService.get<Courier>(`${this.baseUrl}/${courierId}`);
  }

  getAllCouriers(params?: any): Observable<{
    items: Courier[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      lastPage: number;
    };
  }> {
    return this.apiService
      .getPaginated<Courier>(this.baseUrl, 'data', params)
      .pipe(
        // Ensure pagination fields are always numbers
        map((response: any) => ({
          items: response.items,
          pagination: {
            page: response.pagination.page ?? 1,
            limit: response.pagination.limit ?? 10,
            total: response.pagination.total ?? 0,
            lastPage: response.pagination.lastPage ?? 1,
          },
        }))
      );
  }

  updateCourierStatus(courierId: string, status: string): Observable<void> {
    return this.apiService.put<void>(`${this.baseUrl}/${courierId}/status`, {
      status,
    });
  }
}
