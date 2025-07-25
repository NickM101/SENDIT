import { Observable, tap } from "rxjs";
import { ApiService } from "../../../../core/services/api.service";
import { ToastService } from "../../../../core/services/toast.service";

// Angular Parcel Service
export class ParcelService {
  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  async createParcelWithPayment(parcelData: any): Promise<any> {
    try {
      // Step 1: Create parcel
      const parcel = await this.apiService
        .post<any>('/parcels/create', parcelData)
        .toPromise();

      // Step 2: Create payment intent
      const paymentIntent = await this.apiService
        .post<any>('/payments/create-intent', {
          amount: parcel.totalPrice * 100, // Convert to cents
          currency: 'kes',
          parcelId: parcel.id,
          description: `Payment for parcel ${parcel.trackingNumber}`,
        })
        .toPromise();

      return {
        parcel,
        paymentIntent,
      };
    } catch (error) {
      this.toastService.error('Failed to create parcel');
      throw error;
    }
  }

  confirmPayment(paymentIntentId: string, parcelId: string): Observable<any> {
    return this.apiService
      .post('/payments/confirm', {
        paymentIntentId,
        parcelId,
      })
      .pipe(
        tap(() => this.toastService.success('Payment confirmed successfully'))
      );
  }
}
