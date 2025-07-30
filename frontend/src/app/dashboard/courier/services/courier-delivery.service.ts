// src/app/dashboard/courier/services/courier-delivery.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

// Based on Prisma schema
export interface CourierDelivery {
  id: string;
  trackingNumber: string;
  status:
    | 'PROCESSING'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'DELAYED'
    | 'RETURNED'
    | 'CANCELLED';
  packageType:
    | 'STANDARD_BOX'
    | 'DOCUMENT'
    | 'CLOTHING'
    | 'ELECTRONICS'
    | 'FRAGILE'
    | 'LIQUID'
    | 'PERISHABLE';
  deliveryType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'OVERNIGHT';
  weight: number;
  weightUnit: 'kg' | 'lb' | 'g' | 'oz';
  estimatedValue: number;
  description: string;
  totalPrice: number;
  currency: string;

  // Sender information
  sender: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  // Recipient information
  recipient: {
    id?: string;
    name: string;
    email: string;
    phone: string;
  };

  // Address information (from Address model)
  senderAddress: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    street: string;
    area: string;
    city: string;
    county: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  recipientAddress: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    street: string;
    area: string;
    city: string;
    county: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  // Delivery information
  pickupDate?: Date;
  pickupTimeSlot?: string;
  deliveryDate?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;

  // Instructions and special handling
  pickupInstructions?: string;
  deliveryInstructions?: string;
  specialHandling?: string;
  fragile: boolean;
  perishable: boolean;
  hazardousMaterial: boolean;
  highValue: boolean;
  signatureRequired: boolean;

  // Courier assignment (from CourierAssignment model)
  courierAssignment?: {
    id: string;
    assignedAt: Date;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    completedAt?: Date;
  };

  // Tracking history
  trackingHistory?: Array<{
    id: string;
    status: string;
    location?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    timestamp: Date;
    updatedBy?: string;
  }>;

  // Delivery attempts
  deliveryAttempts?: Array<{
    id: string;
    attemptDate: Date;
    status:
      | 'SUCCESSFUL'
      | 'FAILED_NO_ONE_HOME'
      | 'FAILED_INCORRECT_ADDRESS'
      | 'FAILED_REFUSED'
      | 'FAILED_WEATHER'
      | 'FAILED_OTHER';
    reason?: string;
    nextAttempt?: Date;
    courierNotes?: string;
    latitude?: number;
    longitude?: number;
  }>;

  // Calculated fields
  distance?: number;
  estimatedEarnings?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryStatusUpdate {
  parcelId: string;
  status: string;
  location?: string;
  description?: string;
  courierNotes?: string;
  latitude?: number;
  longitude?: number;
  deliveryPhoto?: File;
}

export interface CourierEarnings {
  daily: {
    date: Date;
    totalEarnings: number;
    deliveriesCompleted: number;
    pickupsCompleted: number;
    bonusEarnings: number;
  };
  weekly: {
    weekStart: Date;
    totalEarnings: number;
    deliveriesCompleted: number;
    pickupsCompleted: number;
    averageRating: number;
  };
  monthly: {
    month: string;
    year: number;
    totalEarnings: number;
    deliveriesCompleted: number;
    pickupsCompleted: number;
  };
}

export interface DeliveryFilters {
  status?: string;
  type?: 'PICKUP' | 'DELIVERY';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourierDeliveryService {
  private deliveriesSubject = new BehaviorSubject<CourierDelivery[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private earningsSubject = new BehaviorSubject<CourierEarnings | null>(null);

  public deliveries$ = this.deliveriesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public earnings$ = this.earningsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Get all deliveries assigned to the current courier
   */
  getMyDeliveries(filters?: DeliveryFilters): Observable<CourierDelivery[]> {
    this.loadingSubject.next(true);

    const params: any = {};
    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
      if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
      if (filters.priority) params.priority = filters.priority;
    }

    return this.apiService
      .get<CourierDelivery[]>('/couriers/deliveries', params)
      .pipe(
        tap((deliveries) => {
          this.deliveriesSubject.next(deliveries);
          this.loadingSubject.next(false);
        }),
        map((deliveries) =>
          this.enrichDeliveriesWithCalculatedFields(deliveries)
        )
      );
  }

  /**
   * Get delivery details by ID
   */
  getDeliveryById(deliveryId: string): Observable<CourierDelivery> {
    return this.apiService
      .get<CourierDelivery>(`/couriers/deliveries/${deliveryId}`)
      .pipe(
        map((delivery) => this.enrichDeliveryWithCalculatedFields(delivery))
      );
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(
    update: DeliveryStatusUpdate
  ): Observable<CourierDelivery> {
    const formData = new FormData();
    formData.append('status', update.status);
    if (update.location) formData.append('location', update.location);
    if (update.description) formData.append('description', update.description);
    if (update.courierNotes)
      formData.append('courierNotes', update.courierNotes);
    if (update.latitude)
      formData.append('latitude', update.latitude.toString());
    if (update.longitude)
      formData.append('longitude', update.longitude.toString());
    if (update.deliveryPhoto)
      formData.append('deliveryPhoto', update.deliveryPhoto);

    return this.apiService
      .put<CourierDelivery>(
        `/couriers/deliveries/${update.parcelId}/status`,
        formData
      )
      .pipe(
        tap((updatedDelivery) => {
          // Update the local deliveries list
          const currentDeliveries = this.deliveriesSubject.value;
          const updatedDeliveries = currentDeliveries.map((delivery) =>
            delivery.id === updatedDelivery.id ? updatedDelivery : delivery
          );
          this.deliveriesSubject.next(updatedDeliveries);

          this.toastService.success('Delivery status updated successfully');
        })
      );
  }

  /**
   * Get courier earnings
   */
  getCourierEarnings(): Observable<CourierEarnings> {
    return this.apiService
      .get<CourierEarnings>('/couriers/earnings')
      .pipe(tap((earnings) => this.earningsSubject.next(earnings)));
  }

  /**
   * Get today's route (deliveries for today)
   */
  getTodayRoute(): Observable<CourierDelivery[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getMyDeliveries({
      dateFrom: today,
      dateTo: tomorrow,
    });
  }

  /**
   * Mark delivery as picked up
   */
  markAsPickedUp(
    deliveryId: string,
    location?: { lat: number; lng: number }
  ): Observable<CourierDelivery> {
    return this.updateDeliveryStatus({
      parcelId: deliveryId,
      status: 'PICKED_UP',
      description: 'Package picked up by courier',
      latitude: location?.lat,
      longitude: location?.lng,
    });
  }

  /**
   * Mark delivery as delivered with photo proof
   */
  markAsDelivered(
    deliveryId: string,
    photo: File,
    notes?: string,
    location?: { lat: number; lng: number }
  ): Observable<CourierDelivery> {
    return this.updateDeliveryStatus({
      parcelId: deliveryId,
      status: 'DELIVERED',
      description: 'Package delivered successfully',
      courierNotes: notes,
      deliveryPhoto: photo,
      latitude: location?.lat,
      longitude: location?.lng,
    });
  }

  /**
   * Mark delivery as failed
   */
  markAsFailedDelivery(
    deliveryId: string,
    reason: string,
    location?: { lat: number; lng: number }
  ): Observable<CourierDelivery> {
    return this.updateDeliveryStatus({
      parcelId: deliveryId,
      status: 'DELAYED',
      description: `Delivery failed: ${reason}`,
      courierNotes: reason,
      latitude: location?.lat,
      longitude: location?.lng,
    });
  }

  /**
   * Refresh deliveries list
   */
  refreshDeliveries(): void {
    this.getMyDeliveries().subscribe();
  }

  /**
   * Private helper methods
   */
  private enrichDeliveriesWithCalculatedFields(
    deliveries: CourierDelivery[]
  ): CourierDelivery[] {
    return deliveries.map((delivery) =>
      this.enrichDeliveryWithCalculatedFields(delivery)
    );
  }

  private enrichDeliveryWithCalculatedFields(
    delivery: CourierDelivery
  ): CourierDelivery {
    // Calculate distance (placeholder - would use actual geolocation calculation)
    delivery.distance = this.calculateDistance(
      delivery.senderAddress,
      delivery.recipientAddress
    );

    // Calculate estimated earnings (placeholder - would use actual pricing logic)
    delivery.estimatedEarnings = this.calculateEstimatedEarnings(delivery);

    // Determine priority based on delivery type and scheduled time
    delivery.priority = this.determinePriority(delivery);

    return delivery;
  }

  private calculateDistance(fromAddress: any, toAddress: any): number {
    // Placeholder calculation - in real app would use Google Maps API or similar
    if (
      fromAddress.latitude &&
      fromAddress.longitude &&
      toAddress.latitude &&
      toAddress.longitude
    ) {
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = this.deg2rad(toAddress.latitude - fromAddress.latitude);
      const dLon = this.deg2rad(toAddress.longitude - fromAddress.longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(fromAddress.latitude)) *
          Math.cos(this.deg2rad(toAddress.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    return 0;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateEstimatedEarnings(delivery: CourierDelivery): number {
    // Base earning calculation - would be more complex in real app
    let baseEarning = 50; // KES 50 base

    // Add distance-based earning
    if (delivery.distance) {
      baseEarning += delivery.distance * 10; // KES 10 per km
    }

    // Add delivery type multiplier
    switch (delivery.deliveryType) {
      case 'EXPRESS':
        baseEarning *= 1.5;
        break;
      case 'SAME_DAY':
        baseEarning *= 2;
        break;
      case 'OVERNIGHT':
        baseEarning *= 1.3;
        break;
    }

    // Add special handling bonus
    if (delivery.fragile || delivery.highValue) {
      baseEarning += 25;
    }

    return Math.round(baseEarning);
  }

  private determinePriority(
    delivery: CourierDelivery
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Priority logic based on delivery type and timing
    if (
      delivery.deliveryType === 'SAME_DAY' ||
      delivery.deliveryType === 'EXPRESS'
    ) {
      return 'HIGH';
    }

    if (delivery.fragile || delivery.perishable || delivery.highValue) {
      return 'HIGH';
    }

    // Check if delivery is due soon
    if (delivery.estimatedDelivery) {
      const hoursUntilDelivery =
        (new Date(delivery.estimatedDelivery).getTime() -
          new Date().getTime()) /
        (1000 * 60 * 60);
      if (hoursUntilDelivery <= 4) {
        return 'HIGH';
      } else if (hoursUntilDelivery <= 24) {
        return 'MEDIUM';
      }
    }

    return 'LOW';
  }
}
