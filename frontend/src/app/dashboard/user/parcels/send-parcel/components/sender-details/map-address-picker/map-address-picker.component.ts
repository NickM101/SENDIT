// src/app/dashboard/user/parcels/send-parcel/components/sender-details/map-address-picker/map-address-picker.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import * as L from 'leaflet';
import { KenyanCounty } from '../../../../../../../core/models/pickup-point.model';

interface NominatimAddress {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  importance?: number;
}

export interface AddressData {
  street: string;
  area: string;
  city: string;
  county: KenyanCounty;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode: string;
  postalCode: string; // Optional for backward compatibility 
}

@Component({
  selector: 'app-map-address-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './map-address-picker.component.html',
  styleUrls: ['./map-address-picker.component.css'],
})
export class MapAddressPickerComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() currentAddress: AddressData | null = null;
  @Output() addressSelected = new EventEmitter<AddressData>();
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

   map!: L.Map;
   marker: L.Marker | null = null;
   destroy$ = new Subject<void>();

  // Signals for reactive state
  searchResults = signal<NominatimResult[]>([]);
  selectedAddress = signal<AddressData | null>(null);
  isSearching = signal<boolean>(false);
  isGettingLocation = signal<boolean>(false);
  mapInitialized = signal<boolean>(false);
  searchQuery = signal<string>('');

  searchControl = new FormControl('');

  // Kenya bounds for map focus
  private readonly kenyaBounds: L.LatLngBounds = L.latLngBounds(
    [-4.89, 33.89], // Southwest
    [5.89, 41.89] // Northeast
  );

  // Default center (Nairobi)
  private readonly defaultCenter: L.LatLng = L.latLng(-1.2921, 36.8219);

  // Computed values
  showSearchDropdown = computed(
    () => this.searchResults().length > 0 && this.searchQuery().length > 0
  );

  noResultsFound = computed(
    () =>
      this.searchResults().length === 0 &&
      this.searchQuery().length > 2 &&
      !this.isSearching()
  );

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.setupSearchAutoComplete();
    this.selectedAddress.set(this.currentAddress);
    this.fixLeafletIconPaths();
  }

  ngAfterViewInit() {
    console.log('🗺️ MapAddressPickerComponent: Initializing map');
    setTimeout(() => this.initializeMap(), 250);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIconPaths() {
    // Fix for Leaflet default markers in Angular/Webpack environment
    const iconRetinaUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
    const iconUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;
  }

  private initializeMap() {
    if (!this.mapContainer?.nativeElement) {
      console.error('🗺️ Map container not available');
      return;
    }

    if (this.map) {
      console.warn('🗺️ Map already initialized');
      return;
    }

    try {
      console.log('🗺️ Creating Leaflet map');

      // Create map with Kenya-focused configuration
      this.map = L.map(this.mapContainer.nativeElement, {
        center: this.currentAddress
          ? [this.currentAddress.latitude, this.currentAddress.longitude]
          : this.defaultCenter,
        zoom: this.currentAddress ? 15 : 7,
        maxBounds: this.kenyaBounds,
        maxBoundsViscosity: 0.8,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false,
      });

      // Add OpenStreetMap tile layer
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 6,
          tileSize: 256,
          crossOrigin: true,
        }
      );

      tileLayer.addTo(this.map);

      // Handle tile loading events
      tileLayer.on('load', () => {
        console.log('🗺️ Map tiles loaded successfully');
        this.mapInitialized.set(true);
      });

      tileLayer.on('tileerror', (error) => {
        console.error('🗺️ Tile loading error:', error);
      });

      // Force map size invalidation
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('🗺️ Map size invalidated');
        }
      }, 100);

      // Add existing marker if current address exists
      if (this.currentAddress) {
        console.log('🗺️ Adding marker for current address');
        this.addMarker(
          this.currentAddress.latitude,
          this.currentAddress.longitude
        );
      }

      // Add click event listener
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        console.log('🗺️ Map clicked at:', e.latlng);
        this.handleMapClick(e.latlng.lat, e.latlng.lng);
      });

      // Set map as initialized
      setTimeout(() => this.mapInitialized.set(true), 500);

      console.log('🗺️ Map initialization completed');
    } catch (error) {
      console.error('🗺️ Error initializing map:', error);
    }
  }

  private setupSearchAutoComplete() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.searchQuery.set(query || '');

          if (!query || query.length < 3) {
            this.searchResults.set([]);
            return of([]);
          }

          this.isSearching.set(true);
          return this.searchAddress(query);
        }),
        catchError((error) => {
          console.error('🔍 Search error:', error);
          this.isSearching.set(false);
          return of([]);
        })
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
  }

  private searchAddress(query: string) {
    const params = {
      format: 'json',
      q: `${query}, Kenya`, // Always append Kenya to search
      countrycodes: 'ke',
      limit: '5',
      addressdetails: '1',
      'accept-language': 'en',
    };

    const url = 'https://nominatim.openstreetmap.org/search';
    const queryString = new URLSearchParams(params).toString();

    return this.http.get<NominatimResult[]>(`${url}?${queryString}`);
  }

  selectSearchResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    this.searchResults.set([]);
    this.searchControl.setValue('', { emitEvent: false });
    this.searchQuery.set('');

    if (this.map) {
      this.map.setView([lat, lng], 15);
      this.addMarker(lat, lng);
      this.reverseGeocode(lat, lng);
    }
  }

  private handleMapClick(lat: number, lng: number) {
    console.log('🗺️ Map click handler:', { lat, lng });

    // Verify coordinates are within Kenya bounds
    if (!this.isWithinKenya(lat, lng)) {
      console.warn('🗺️ Location outside Kenya bounds');
      // You could show a toast/alert here
      return;
    }

    this.addMarker(lat, lng);
    this.reverseGeocode(lat, lng);
  }

  private isWithinKenya(lat: number, lng: number): boolean {
    return lat >= -4.89 && lat <= 5.89 && lng >= 33.89 && lng <= 41.89;
  }

  private addMarker(lat: number, lng: number) {
    console.log('🗺️ Adding marker at:', { lat, lng });

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Create custom marker with Kenyan styling
    const customIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #10b981, #059669);
          border: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    try {
      this.marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: false,
      }).addTo(this.map);

      console.log('🗺️ Marker added successfully');
    } catch (error) {
      console.error('🗺️ Error adding marker:', error);
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    console.log('🔄 Starting reverse geocoding for:', { lat, lng });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`;

    this.http.get<NominatimResult>(url).subscribe({
      next: (result) => {
        console.log('✅ Reverse geocoding successful:', result);
        const addressData = this.parseAddressFromResult(result, lat, lng);
        this.selectedAddress.set(addressData);
        console.log('📍 Selected address updated:', addressData);
      },
      error: (error) => {
        console.error('❌ Reverse geocoding failed:', error);
        // Fallback address
        const fallbackAddress: AddressData = {
          street: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          area: 'Unknown Area',
          city: 'Unknown City',
          county: KenyanCounty.NAIROBI, // Default to Nairobi
          country: 'Kenya',
          postalCode: '00000',
          zipCode: '00000',
          latitude: lat,
          longitude: lng,
          formattedAddress: `Location at ${lat.toFixed(4)}, ${lng.toFixed(
            4
          )}, Kenya`,
        };
        this.selectedAddress.set(fallbackAddress);
        console.log('🔄 Fallback address created:', fallbackAddress);
      },
    });
  }

  private parseAddressFromResult(
    result: NominatimResult,
    lat: number,
    lng: number
  ): AddressData {
    const addr = result.address || {};

    console.log('🔍 Parsing address from result:', { result, lat, lng });

    // Map county names to enum values
    const countyMapping: { [key: string]: KenyanCounty } = {
      nairobi: KenyanCounty.NAIROBI,
      mombasa: KenyanCounty.MOMBASA,
      kisumu: KenyanCounty.KISUMU,
      nakuru: KenyanCounty.NAKURU,
      uasin_gishu: KenyanCounty.UASIN_GISHU,
      kiambu: KenyanCounty.KIAMBU,
      machakos: KenyanCounty.MACHAKOS,
      kajiado: KenyanCounty.KAJIADO,
      muranga: KenyanCounty.MURANGA,
      nyeri: KenyanCounty.NYERI,
      // Add more mappings as needed
    };

    const countyName = (addr.county || addr.state || '').toLowerCase();
    const mappedCounty = countyMapping[countyName] || KenyanCounty.NAIROBI;

    const parsedAddress: AddressData = {
      street:
        addr.road || addr.house_number
          ? `${addr.house_number || ''} ${addr.road || ''}`.trim()
          : `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      area: addr.suburb || addr.neighbourhood || addr.quarter || 'Unknown Area',
      city: addr.city || addr.town || addr.village || 'Unknown City',
      county: mappedCounty,
      country: 'Kenya',
      latitude: lat,
      longitude: lng,
      formattedAddress: result.display_name,
      zipCode: addr.postcode || '00000',
      postalCode: addr.postcode || '00000',
    };

    console.log('📍 Parsed address data:', parsedAddress);
    return parsedAddress;
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      console.warn('🌍 Geolocation not supported');
      // You could show a toast here
      return;
    }

    this.isGettingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Check if location is within Kenya bounds
        if (this.isWithinKenya(lat, lng)) {
          if (this.map) {
            this.map.setView([lat, lng], 15);
            this.addMarker(lat, lng);
            this.reverseGeocode(lat, lng);
          }
        } else {
          console.warn('🌍 Current location outside Kenya');
          // You could show a toast here
        }

        this.isGettingLocation.set(false);
      },
      (error) => {
        console.error('🌍 Error getting location:', error);
        this.isGettingLocation.set(false);
        // You could show a toast here
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  confirmAddress() {
    const address = this.selectedAddress();
    if (address) {
      console.log('✅ Confirming address selection:', address);
      this.addressSelected.emit(address);
      console.log('📤 Address emitted to parent component');
    } else {
      console.warn('⚠️ No address selected to confirm');
    }
  }

  clearSelection() {
    this.selectedAddress.set(null);
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.searchControl.setValue('');
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  getResultTitle(result: NominatimResult): string {
    const addr = result.address;
    if (addr?.road) {
      return addr.road + (addr.suburb ? `, ${addr.suburb}` : '');
    }
    return result.display_name.split(',')[0];
  }

  getResultSubtitle(result: NominatimResult): string {
    const addr = result.address;
    const parts = [];

    if (addr?.city || addr?.town) {
      parts.push(addr.city || addr.town);
    }
    if (addr?.county) {
      parts.push(addr.county);
    }

    return parts.join(', ') || 'Kenya';
  }

  trackByResult(index: number, result: NominatimResult): string {
    return result.display_name;
  }

  // Format coordinates for display
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  // Get location accuracy indicator
  getLocationAccuracy(): string {
    const address = this.selectedAddress();
    if (!address) return '';

    if (
      address.street !==
      `Location at ${address.latitude.toFixed(4)}, ${address.longitude.toFixed(
        4
      )}`
    ) {
      return 'High accuracy';
    }
    return 'Approximate location';
  }
}
