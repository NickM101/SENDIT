// src/app/shared/services/parcel.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, tap, catchError, throwError } from 'rxjs';
import { Parcel, ParcelDetails } from '../../core/models/parcel.model';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

export interface AdminStatsResponse {
  totalParcels: number;
  pendingAssignment: number;
  inTransit: number;
  delivered: number;
  monthlyGrowth: number;
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreateParcelWithPaymentResponse {
  parcel: Parcel;
  paymentIntent: PaymentIntentResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ParcelService {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly baseUrl = `/parcels`;
  private readonly adminUrl = `/admin/parcels`;
  private readonly paymentsUrl = `/payments`;

  // Admin endpoints
  getAdminParcels(params: any): Observable<{
    items: Parcel[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      lastPage: number;
    };
  }> {
    return this.apiService.getPaginated<Parcel>(
      `${this.adminUrl}/pending-assignment`,
      'data',
      params
    ).pipe(
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

  getAdminStats(): Observable<AdminStatsResponse> {
    return this.apiService.get<AdminStatsResponse>(`${this.adminUrl}/stats`);
  }

  assignCourier(parcelId: string, assignmentData: any): Observable<Parcel> {
    return this.apiService.put<Parcel>(
      `${this.adminUrl}/${parcelId}/assign-courier`,
      assignmentData
    );
  }

  updateParcelStatus(parcelId: string, statusData: any): Observable<void> {
    return this.apiService.put<void>(
      `${this.baseUrl}/${parcelId}/status`,
      statusData
    );
  }

  deleteParcel(parcelId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.adminUrl}/${parcelId}`);
  }

  bulkAction(action: string, parcelIds: string[]): Observable<void> {
    return this.apiService.post<void>(`${this.adminUrl}/bulk-action`, {
      action,
      parcelIds,
    });
  }

  // Public endpoints
  getParcelByTrackingNumber(trackingNumber: string): Observable<ParcelDetails> {
    return this.apiService.get<ParcelDetails>(
      `${this.baseUrl}/track/${trackingNumber}`
    );
  }

  getParcelsByUser(params: any): Observable<{
    items: Parcel[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      lastPage: number;
    };
  }> {
    return this.apiService.getPaginated<Parcel>(
      `${this.baseUrl}/my-parcels`,
      'data',
      params
    ).pipe(
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

  // Payment-related methods using Observables
  createParcelWithPayment(
    parcelData: any
  ): Observable<CreateParcelWithPaymentResponse> {
    return this.apiService
      .post<Parcel>(`${this.baseUrl}/create`, parcelData)
      .pipe(
        switchMap((parcel) =>
          this.createPaymentIntent({
            amount: parcel.totalPrice * 100, // Convert to cents
            currency: 'kes',
            parcelId: parcel.id,
            description: `Payment for parcel ${parcel.trackingNumber}`,
          }).pipe(map((paymentIntent) => ({ parcel, paymentIntent })))
        ),
        tap({
          next: () =>
            this.toastService.success(
              'Parcel and payment created successfully'
            ),
          error: () => this.toastService.error('Failed to create parcel'),
        }),
        catchError((error) => {
          console.error('Error in createParcelWithPayment:', error);
          return throwError(() => error);
        })
      );
  }

  createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    parcelId: string;
    description: string;
  }): Observable<PaymentIntentResponse> {
    return this.apiService
      .post<PaymentIntentResponse>(
        `${this.paymentsUrl}/create-intent`,
        paymentData
      )
      .pipe(
        catchError((error) => {
          this.toastService.error('Failed to create payment intent');
          return throwError(() => error);
        })
      );
  }

  confirmPayment(paymentIntentId: string, parcelId: string): Observable<any> {
    return this.apiService
      .post(`${this.paymentsUrl}/confirm`, {
        paymentIntentId,
        parcelId,
      })
      .pipe(
        tap(() => this.toastService.success('Payment confirmed successfully')),
        catchError((error) => {
          this.toastService.error('Failed to confirm payment');
          return throwError(() => error);
        })
      );
  }
}
