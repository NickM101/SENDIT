// src/app/core/services/parcel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Parcel {
  id: string;
  trackingNumber: string;
  status: string;
  packageType: string;
  weight: number;
  totalPrice: number;
  createdAt: string;
  sender: any;
  recipient: any;
  senderAddress: any;
  recipientAddress: any;
  trackingHistory: any[];
}

export interface ParcelListResponse {
  parcels: Parcel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private apiUrl = 'http://localhost:3000/parcels';

  constructor(private http: HttpClient) {}

  createParcel(parcelData: any): Observable<Parcel> {
    return this.http.post<Parcel>(this.apiUrl, parcelData);
  }

  getParcels(page = 1, limit = 10, filters: any = {}): Observable<ParcelListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<ParcelListResponse>(this.apiUrl, { params });
  }

  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${id}`);
  }

  updateParcelStatus(id: string, status: string, location?: string, description?: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${id}/status`, {
      status,
      location,
      description
    });
  }

  trackParcel(trackingNumber: string): Observable<Parcel> {
    return this.http.get<Parcel>(`http://localhost:3000/track/${trackingNumber}`);
  }

  calculatePrice(weight: number, deliveryType: string = 'STANDARD'): number {
    let basePrice: number;
    
    if (weight < 1) basePrice = 15;
    else if (weight <= 5) basePrice = 25;
    else if (weight <= 20) basePrice = 45;
    else basePrice = 75;

    const multipliers: { [key: string]: number } = {
      'STANDARD': 1,
      'EXPRESS': 1.5,
      'SAME_DAY': 2.5,
      'OVERNIGHT': 2
    };

    return basePrice * (multipliers[deliveryType] || 1);
  }
}
