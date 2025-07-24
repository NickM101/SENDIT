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
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { GeocodingService } from '../../../../../../../core/services/geocoding.service';
import { LeafletConfigService } from '../../../../../../../core/services/leaflet-config.service';

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
}

interface AddressData {
  street: string;
  area: string;
  city: string;
  county: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  state: string;
  zipCode: string;
}

@Component({
  selector: 'app-map-address-picker',
  templateUrl: './map-address-picker.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class MapAddressPickerComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() currentAddress: AddressData | null = null;
  @Output() addressSelected = new EventEmitter<AddressData>();

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map!: L.Map;
  private marker: L.Marker | null = null;
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  searchResults: NominatimResult[] = [];
  selectedAddress: AddressData | null = null;
  isSearching = false;
  isGettingLocation = false;
  mapInitialized = false;

  // Kenya bounds for map focus
  private kenyaBounds: L.LatLngBounds = L.latLngBounds(
    [-4.89, 33.89], // Southwest
    [5.89, 41.89] // Northeast
  );

  // Default center (Nairobi)
  private defaultCenter: L.LatLng = L.latLng(-1.2921, 36.8219);

  constructor(
    private http: HttpClient,
    private leafletConfig: LeafletConfigService,
    private geocoding: GeocodingService
  ) {}

  ngOnInit() {
    this.setupSearchAutoComplete();
    this.selectedAddress = this.currentAddress;

    // Fix Leaflet default icon paths issue
    this.fixLeafletIconPaths();
  }

  ngAfterViewInit() {
    console.log('MapAddressPickerComponent: ngAfterViewInit called');
    // Initialize map after view is ready with a longer delay to ensure DOM is ready
    setTimeout(() => {
      console.log('MapAddressPickerComponent: Initializing map');
      this.initializeMap();
    }, 250);
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
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
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

  initializeMap() {
    console.log('MapAddressPickerComponent: initializeMap called');
    if (!this.mapContainer?.nativeElement) {
      console.error('MapAddressPickerComponent: mapContainer is not available');
      return;
    }

    if (this.map) {
      console.warn('MapAddressPickerComponent: Map is already initialized');
      return;
    }

    try {
      console.log('MapAddressPickerComponent: Creating Leaflet map');

      // Create map with proper configuration
      this.map = L.map(this.mapContainer.nativeElement, {
        center: this.currentAddress
          ? [this.currentAddress.latitude, this.currentAddress.longitude]
          : [-1.2921, 36.8219], // Nairobi center
        zoom: this.currentAddress ? 15 : 7,
        maxBounds: [
          [-4.89, 33.89], // Southwest Kenya
          [5.89, 41.89], // Northeast Kenya
        ],
        maxBoundsViscosity: 0.8,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false, // This helps with tile loading
      });

      // Add tile layer with proper error handling
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

      // Wait for tiles to load
      tileLayer.on('load', () => {
        console.log('MapAddressPickerComponent: Tiles loaded successfully');
        this.mapInitialized = true;
      });

      tileLayer.on('tileerror', (error) => {
        console.error('MapAddressPickerComponent: Tile loading error', error);
      });

      // Force map to invalidate size after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('MapAddressPickerComponent: Map size invalidated');
        }
      }, 100);

      // Add existing marker if current address exists
      if (this.currentAddress) {
        console.log(
          'MapAddressPickerComponent: Adding marker for current address',
          this.currentAddress
        );
        this.addMarker(
          this.currentAddress.latitude,
          this.currentAddress.longitude
        );
      }

      // Add click event listener
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        console.log('MapAddressPickerComponent: Map clicked at', e.latlng);
        this.handleMapClick(e.latlng.lat, e.latlng.lng);
      });

      // Set map as initialized after a short delay
      setTimeout(() => {
        this.mapInitialized = true;
      }, 500);

      console.log('MapAddressPickerComponent: Map initialization completed');
    } catch (error) {
      console.error('MapAddressPickerComponent: Error initializing map', error);
    }
  }

  private setupSearchAutoComplete() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 3) {
            this.searchResults = [];
            return of([]);
          }

          this.isSearching = true;
          return this.searchAddress(query);
        }),
        catchError((error) => {
          console.error('Search error:', error);
          this.isSearching = false;
          return of([]);
        })
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.isSearching = false;
      });
  }

  private searchAddress(query: string) {
    const params = {
      format: 'json',
      q: query,
      countrycodes: 'ke', // Restrict to Kenya
      limit: '5',
      addressdetails: '1',
    };

    const url = 'https://nominatim.openstreetmap.org/search';
    const queryString = new URLSearchParams(params).toString();

    return this.http.get<NominatimResult[]>(`${url}?${queryString}`);
  }

  selectSearchResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    this.searchResults = [];
    this.searchControl.setValue('', { emitEvent: false });

    if (this.map) {
      this.map.setView([lat, lng], 15);
      this.addMarker(lat, lng);
      this.reverseGeocode(lat, lng);
    }
  }

  private handleMapClick(lat: number, lng: number) {
    console.log('MapAddressPickerComponent: handleMapClick called with', {
      lat,
      lng,
    });
    this.addMarker(lat, lng);
    this.reverseGeocode(lat, lng);
  }

  private addMarker(lat: number, lng: number) {
    console.log('MapAddressPickerComponent: addMarker called with', {
      lat,
      lng,
    });

    if (this.marker) {
      console.log('MapAddressPickerComponent: Removing existing marker');
      this.map.removeLayer(this.marker);
    }

    // Create a custom icon using DivIcon for better control
    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
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

      console.log('MapAddressPickerComponent: Marker added successfully');
    } catch (error) {
      console.error('MapAddressPickerComponent: Error adding marker', error);
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    console.log('🔄 Starting reverse geocoding for:', { lat, lng });
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    this.http.get<NominatimResult>(url).subscribe({
      next: (result) => {
        console.log('✅ Reverse geocoding successful:', result);
        this.selectedAddress = this.parseAddressFromResult(result, lat, lng);
        console.log('📍 Selected address updated:', this.selectedAddress);
      },
      error: (error) => {
        console.error('❌ Reverse geocoding failed:', error);
        this.selectedAddress = {
          street: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          area: 'Unknown Area',
          city: 'Unknown City',
          county: 'Unknown County',
          country: 'Kenya',
          state: 'Unknown State',
          zipCode: '00000',
          latitude: lat,
          longitude: lng,
          formattedAddress: `Location at ${lat.toFixed(4)}, ${lng.toFixed(
            4
          )}, Kenya`,
        };
        console.log('🔄 Fallback address created:', this.selectedAddress);
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

    const parsedAddress = {
      street:
        addr.road || addr.house_number
          ? `${addr.house_number || ''} ${addr.road || ''}`.trim()
          : `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      area: addr.suburb || addr.neighbourhood || addr.quarter || 'Unknown Area',
      city: addr.city || addr.town || addr.village || 'Unknown City',
      county: addr.county || addr.state || 'Unknown County',
      country: 'Kenya',
      latitude: lat,
      longitude: lng,
      formattedAddress: result.display_name,
      state: addr.county || addr.state || 'Unknown State',
      zipCode: addr.postcode || '00000',
    };

    console.log('📍 Parsed address data:', parsedAddress);
    return parsedAddress;
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    this.isGettingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Check if location is within Kenya bounds
        if (this.kenyaBounds.contains([lat, lng])) {
          if (this.map) {
            this.map.setView([lat, lng], 15);
            this.addMarker(lat, lng);
            this.reverseGeocode(lat, lng);
          }
        } else {
          alert(
            'Your current location appears to be outside Kenya. Please select a location within Kenya.'
          );
        }

        this.isGettingLocation = false;
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(
          'Unable to get your current location. Please select manually on the map.'
        );
        this.isGettingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  confirmAddress() {
    if (this.selectedAddress) {
      console.log('✅ Confirming address selection:', this.selectedAddress);
      this.addressSelected.emit(this.selectedAddress);

      // Show success feedback
      console.log('📤 Address emitted to parent component');
    } else {
      console.warn('⚠️ No address selected to confirm');
    }
  }

  clearSelection() {
    this.selectedAddress = null;
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }

  getResultTitle(result: NominatimResult): string {
    const addr = result.address;
    if (addr?.road) {
      return addr.road + (addr.suburb ? `, ${addr.suburb}` : '');
    }
    return result.display_name.split(',')[0];
  }

  trackByResult(index: number, result: NominatimResult): string {
    return result.display_name;
  }
}
