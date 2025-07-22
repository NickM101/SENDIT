// src/app/core/services/parcel.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse, QueryParams } from '../../shared/models/api.model';

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



@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  constructor(private apiService: ApiService) {}

  createParcel(parcelData: any): Observable<Parcel> {
    return this.apiService.post<Parcel>('/parcels', parcelData);
  }

  getParcels(page = 1, limit = 10, filters: QueryParams = {}): Observable<PaginatedResponse<Parcel>> {
    const params: QueryParams = {
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    };
    return this.apiService.getPaginated<Parcel>('/parcels', 'parcels', params);
  }

  getParcelById(id: string): Observable<Parcel> {
    return this.apiService.get<Parcel>(`/parcels/${id}`);
  }

  updateParcelStatus(id: string, status: string, location?: string, description?: string): Observable<Parcel> {
    return this.apiService.put<Parcel>(`/parcels/${id}/status`, {
      status,
      location,
      description
    });
  }

  trackParcel(trackingNumber: string): Observable<Parcel> {
    return this.apiService.get<Parcel>(`/track/${trackingNumber}`);
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
