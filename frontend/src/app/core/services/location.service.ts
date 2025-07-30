// src/app/core/services/location.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private currentLocationSubject =
    new BehaviorSubject<LocationCoordinates | null>(null);
  private watchId: number | null = null;

  public currentLocation$ = this.currentLocationSubject.asObservable();

  constructor() {}

  /**
   * Get current position once
   */
  getCurrentPosition(
    options?: LocationOptions
  ): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser');
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.currentLocationSubject.next(coords);
          observer.next(position);
          observer.complete();
        },
        (error) => {
          console.error('Geolocation error:', error);
          observer.error(this.handleLocationError(error));
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch position changes
   */
  watchPosition(options?: LocationOptions): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser');
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 5000,
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.currentLocationSubject.next(coords);
          observer.next(position);
        },
        (error) => {
          console.error('Geolocation watch error:', error);
          observer.error(this.handleLocationError(error));
        },
        defaultOptions
      );

      // Return cleanup function
      return () => {
        if (this.watchId !== null) {
          navigator.geolocation.clearWatch(this.watchId);
          this.watchId = null;
        }
      };
    });
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Check if geolocation is supported
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request permission for geolocation
   */
  async requestPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      throw new Error('Permissions API not supported');
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation',
      });
      return permission.state;
    } catch (error) {
      console.error('Error requesting geolocation permission:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Check if coordinates are within Kenya bounds
   */
  isWithinKenya(lat: number, lon: number): boolean {
    return lat >= -4.89 && lat <= 5.89 && lon >= 33.89 && lon <= 41.89;
  }

  /**
   * Get formatted address from coordinates (requires external service)
   */
  reverseGeocode(lat: number, lon: number): Observable<string> {
    return new Observable((observer) => {
      // This would typically use a geocoding service like Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

      fetch(nominatimUrl)
        .then((response) => response.json())
        .then((data) => {
          const address =
            data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          observer.next(address);
          observer.complete();
        })
        .catch((error) => {
          console.error('Reverse geocoding error:', error);
          observer.next(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          observer.complete();
        });
    });
  }

  /**
   * Get current location coordinates (from cache or fresh)
   */
  getCurrentCoordinates(): LocationCoordinates | null {
    return this.currentLocationSubject.value;
  }

  /**
   * Format coordinates as string
   */
  formatCoordinates(lat: number, lon: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private handleLocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied by user';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable';
      case error.TIMEOUT:
        return 'Location request timed out';
      default:
        return 'An unknown location error occurred';
    }
  }
}
