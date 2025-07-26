// src/app/dashboard/user/tracking/components/delivery-map/delivery-map.component.ts
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { ParcelDetails } from '../../../../../core/models/parcel.model';

declare var L: any; // Leaflet library

@Component({
  selector: 'app-delivery-map',
  templateUrl: './delivery-map.component.html',
  imports: [SharedModule]
})
export class DeliveryMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() parcel!: ParcelDetails;

  private map: any;
  private markers: any[] = [];
  private route: any;
  isMapLoaded = false;
  mapError = false;

  ngOnInit(): void {
    // Load Leaflet CSS and JS if not already loaded
    this.loadLeafletAssets();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Load Leaflet assets dynamically
   */
  private loadLeafletAssets(): void {
    // Check if Leaflet is already loaded
    if (typeof L !== 'undefined') {
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      this.initializeMap();
    };
    script.onerror = () => {
      this.mapError = true;
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize the map
   */
  private initializeMap(): void {
    try {
      if (typeof L === 'undefined') {
        this.mapError = true;
        return;
      }

      // Default center (Nairobi)
      const defaultCenter: [number, number] = [-1.2921, 36.8219];
      let mapCenter = defaultCenter;

      // Use sender address as initial center if available
      if (
        this.parcel.senderAddress.latitude &&
        this.parcel.senderAddress.longitude
      ) {
        mapCenter = [
          this.parcel.senderAddress.latitude,
          this.parcel.senderAddress.longitude,
        ];
      }

      // Initialize map
      this.map = L.map('delivery-map', {
        center: mapCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(this.map);

      // Add markers and route
      this.addMarkersAndRoute();
      this.isMapLoaded = true;
    } catch (error) {
      console.error('Error initializing map:', error);
      this.mapError = true;
    }
  }

  /**
   * Add markers and route to the map
   */
  private addMarkersAndRoute(): void {
    try {
      // Custom icons
      const senderIcon = L.divIcon({
        html: '<div class="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold">P</div>',
        iconSize: [24, 24],
        className: 'custom-div-icon',
      });

      const recipientIcon = L.divIcon({
        html: '<div class="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">D</div>',
        iconSize: [24, 24],
        className: 'custom-div-icon',
      });

      const courierIcon = L.divIcon({
        html: '<div class="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">C</div>',
        iconSize: [24, 24],
        className: 'custom-div-icon',
      });

      // Add sender marker
      if (
        this.parcel.senderAddress.latitude &&
        this.parcel.senderAddress.longitude
      ) {
        const senderMarker = L.marker(
          [
            this.parcel.senderAddress.latitude,
            this.parcel.senderAddress.longitude,
          ],
          { icon: senderIcon }
        ).addTo(this.map);

        senderMarker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm text-gray-900">Pickup Location</h3>
            <p class="text-xs text-gray-600 mt-1">${this.parcel.senderAddress.area}, ${this.parcel.senderAddress.city}</p>
            <p class="text-xs text-gray-500">${this.parcel.sender.name}</p>
          </div>
        `);

        this.markers.push(senderMarker);
      }

      // Add recipient marker
      if (
        this.parcel.recipientAddress.latitude &&
        this.parcel.recipientAddress.longitude
      ) {
        const recipientMarker = L.marker(
          [
            this.parcel.recipientAddress.latitude,
            this.parcel.recipientAddress.longitude,
          ],
          { icon: recipientIcon }
        ).addTo(this.map);

        recipientMarker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm text-gray-900">Delivery Location</h3>
            <p class="text-xs text-gray-600 mt-1">${
              this.parcel.recipientAddress.area
            }, ${this.parcel.recipientAddress.city}</p>
            <p class="text-xs text-gray-500">${
              this.parcel.recipient?.name || 'Recipient'
            }</p>
          </div>
        `);

        this.markers.push(recipientMarker);
      }

      // Add courier current location if available and in transit
      const latestTracking = this.parcel.trackingHistory?.[0];
      if (
        latestTracking &&
        latestTracking.latitude &&
        latestTracking.longitude &&
        ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(this.parcel.status)
      ) {
        const courierMarker = L.marker(
          [latestTracking.latitude, latestTracking.longitude],
          { icon: courierIcon }
        ).addTo(this.map);

        courierMarker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm text-gray-900">Current Location</h3>
            <p class="text-xs text-gray-600 mt-1">${
              latestTracking.location || 'In Transit'
            }</p>
            <p class="text-xs text-gray-500">${new Date(
              latestTracking.timestamp
            ).toLocaleString()}</p>
          </div>
        `);

        this.markers.push(courierMarker);
      }

      // Fit map to show all markers
      if (this.markers.length > 0) {
        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }

      // Add route line if both locations are available
      this.addRouteLineIfAvailable();
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }

  /**
   * Add route line between pickup and delivery locations
   */
  private addRouteLineIfAvailable(): void {
    const senderAddr = this.parcel.senderAddress;
    const recipientAddr = this.parcel.recipientAddress;

    if (
      senderAddr.latitude &&
      senderAddr.longitude &&
      recipientAddr.latitude &&
      recipientAddr.longitude
    ) {
      const routeCoordinates = [
        [senderAddr.latitude, senderAddr.longitude],
        [recipientAddr.latitude, recipientAddr.longitude],
      ];

      this.route = L.polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5',
      }).addTo(this.map);
    }
  }

  /**
   * Refresh map
   */
  onRefreshMap(): void {
    if (this.map) {
      this.map.invalidateSize();
      setTimeout(() => {
        this.addMarkersAndRoute();
      }, 100);
    }
  }

  /**
   * Toggle fullscreen map
   */
  onToggleFullscreen(): void {
    // TODO: Implement fullscreen toggle
    console.log('Toggle fullscreen not implemented yet');
  }

  /**
   * Get directions
   */
  onGetDirections(): void {
    const senderAddr = this.parcel.senderAddress;
    const recipientAddr = this.parcel.recipientAddress;

    if (
      senderAddr.latitude &&
      senderAddr.longitude &&
      recipientAddr.latitude &&
      recipientAddr.longitude
    ) {
      const directionsUrl = `https://www.google.com/maps/dir/${senderAddr.latitude},${senderAddr.longitude}/${recipientAddr.latitude},${recipientAddr.longitude}`;
      window.open(directionsUrl, '_blank');
    }
  }
}
