// src/app/core/services/leaflet-config.service.ts
import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root',
})
export class LeafletConfigService {
  constructor() {
    this.fixDefaultIcon();
  }

  // Fix for default marker icons in Angular/Webpack
  private fixDefaultIcon() {
    // Delete the default icon URL method to prevent webpack issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // Set custom paths for marker icons
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
  }

  // Kenya-specific map configuration
  getKenyaMapConfig(): L.MapOptions {
    return {
      center: [-1.2921, 36.8219], // Nairobi
      zoom: 7,
      maxBounds: [
        [-4.89, 33.89], // Southwest Kenya
        [5.89, 41.89], // Northeast Kenya
      ],
      maxBoundsViscosity: 0.8,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false, // Use SVG rendering for better tile display
      zoomSnap: 1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 60,
    };
  }

  // Create tile layer for Kenya with proper configuration
  createTileLayer(): L.TileLayer {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 6,
      tileSize: 256,
      zoomOffset: 0,
      crossOrigin: true,
      updateWhenZooming: false, // Helps prevent tile fragmentation
      keepBuffer: 2, // Keep more tiles in memory for smoother experience
    });
  }

  // Create custom marker for pickup/delivery
  createCustomMarker(type: 'pickup' | 'delivery' = 'pickup'): L.DivIcon {
    const color = type === 'pickup' ? '#10B981' : '#EF4444';
    const icon = type === 'pickup' ? '📦' : '🏠';

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 14px;
        ">${icon}</div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }

  // Create a simple location marker
  createLocationMarker(): L.DivIcon {
    return L.divIcon({
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
      className: 'location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
}
