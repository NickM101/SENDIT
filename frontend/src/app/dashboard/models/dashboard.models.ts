// File: src/app/dashboard/models/dashboard.models.ts
// Dashboard models and interfaces for SendIT application

export interface DashboardStats {
  totalParcelsSent: number;
  parcelsReceived: number;
  pendingDeliveries: number;
  totalSpent?: number;
  sentGrowth: number;
  receivedGrowth: number;
  pendingGrowth: number;
  spentGrowth?: number;
}

export interface RecentParcel {
  id: string;
  trackingNumber: string;
  description: string;
  recipient?: {
    name: string;
    location: string;
  };
  sender?: {
    name: string;
    location: string;
  };
  status: ParcelStatus;
  dateSent: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  type: 'sent' | 'received';
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  enabled: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  operatingHours: string;
  contactNumber: string;
  services: string[];
}

export interface TrackingUpdate {
  id: string;
  parcelId: string;
  status: ParcelStatus;
  location: string;
  timestamp: string;
  description: string;
  estimatedNextUpdate?: string;
}

export interface DashboardPreferences {
  showRecentParcels: boolean;
  showNotifications: boolean;
  showQuickActions: boolean;
  showDeliveryMap: boolean;
  defaultView: 'overview' | 'parcels' | 'tracking';
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export enum ParcelStatus {
  PROCESSING = 'PROCESSING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export interface DashboardFilter {
  dateRange: {
    start: string;
    end: string;
  };
  status: ParcelStatus[];
  type: ('sent' | 'received')[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface ActivityFeed {
  id: string;
  type:
    | 'parcel_created'
    | 'parcel_delivered'
    | 'status_updated'
    | 'payment_completed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    parcelId?: string;
    trackingNumber?: string;
    amount?: number;
  };
}
