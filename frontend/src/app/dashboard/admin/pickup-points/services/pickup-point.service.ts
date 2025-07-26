import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';
import { QueryParams, PaginatedResponse } from '../../../../shared/models/api.model';
import { PickupPoint } from '../../../../core/models/pickup-point.model';


@Injectable({
  providedIn: 'root',
})
export class PickupPointService {
  private readonly endpoint = '/pickup-points';

  constructor(private api: ApiService) {}

  /** Get Pickup Points (with filters, pagination, sorting) */
  getPickupPoints(
    params?: QueryParams
  ): Observable<PaginatedResponse<PickupPoint>> {
    return this.api.getPaginated<PickupPoint>(this.endpoint, 'items', params);
  }

  /** Get a Pickup Point by ID */
  getPickupPointById(id: string): Observable<PickupPoint> {
    return this.api.get<PickupPoint>(`${this.endpoint}/${id}`);
  }

  /** Create Pickup Point */
  createPickupPoint(payload: Partial<PickupPoint>): Observable<PickupPoint> {
    return this.api.post<PickupPoint>(this.endpoint, payload);
  }

  /** Update Pickup Point */
  updatePickupPoint(
    id: string,
    payload: Partial<PickupPoint>
  ): Observable<PickupPoint> {
    return this.api.put<PickupPoint>(`${this.endpoint}/${id}`, payload);
  }

  /** Delete Pickup Point */
  deletePickupPoint(id: string): Observable<PickupPoint> {
    return this.api.delete<PickupPoint>(`${this.endpoint}/${id}`);
  }
}
