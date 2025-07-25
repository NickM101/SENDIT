import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(private apiService: ApiService) {}

  createPaymentIntent(data: {
    amount: number;
    currency?: string;
    parcelId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Observable<any> {
    return this.apiService.post('/payments/create-intent', data);
  }

  confirmPayment(paymentIntentId: string, parcelId: string): Observable<any> {
    return this.apiService.post('/payments/confirm', {
      paymentIntentId,
      parcelId,
    });
  }

  getPaymentById(paymentId: string): Observable<any> {
    return this.apiService.get(`/payments/${paymentId}`);
  }

  getPaymentHistory(params?: any): Observable<any> {
    return this.apiService.get('/payments/history', params);
  }
}
