import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    country?: string;
    postcode?: string;
  };
  importance?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly baseUrl = environment.nominatim.baseUrl;

  constructor(private http: HttpClient) {}

  // Search for addresses in Kenya
  searchAddresses(
    query: string,
    limit: number = 5
  ): Observable<GeocodingResult[]> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('q', query)
      .set('countrycodes', environment.nominatim.countryCode)
      .set('limit', limit.toString())
      .set('addressdetails', '1')
      .set('accept-language', environment.nominatim.language);

    return this.http.get<GeocodingResult[]>(`${this.baseUrl}/search`, {
      params,
    });
  }

  // Reverse geocode coordinates to address
  reverseGeocode(lat: number, lon: number): Observable<GeocodingResult> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('addressdetails', '1')
      .set('accept-language', environment.nominatim.language);

    return this.http.get<GeocodingResult>(`${this.baseUrl}/reverse`, {
      params,
    });
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Check if coordinates are within Kenya bounds
  isWithinKenya(lat: number, lon: number): boolean {
    return lat >= -4.89 && lat <= 5.89 && lon >= 33.89 && lon <= 41.89;
  }
}
