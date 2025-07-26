export interface Parcel {
  id: string;
  trackingNumber: string;
  description: string;
  status: ParcelStatus;
  totalPrice: number;
  currency: string;
  weight?: number;
  weightUnit?: string;
  createdAt: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  recipient: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    };
  };
  sender: {
    name: string;
    email: string;
    phone: string;
  };
  packageType: PackageType;
  deliveryType: DeliveryType;
}

export enum ParcelStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum PackageType {
  STANDARD_BOX = 'STANDARD_BOX',
  DOCUMENT = 'DOCUMENT',
  CLOTHING = 'CLOTHING',
  ELECTRONICS = 'ELECTRONICS',
  FRAGILE = 'FRAGILE',
  LIQUID = 'LIQUID',
  PERISHABLE = 'PERISHABLE',
}

export enum DeliveryType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
  OVERNIGHT = 'OVERNIGHT',
}

export interface ParcelStats {
  totalSent: number;
  totalReceived: number;
  pending: number;
  delivered: number;
  inTransit: number;
  monthlyGrowth: number;
}

export interface ParcelFilters {
  search?: string;
  status?: ParcelStatus;
  startDate?: Date;
  endDate?: Date;
  packageType?: PackageType;
  deliveryType?: DeliveryType;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
  };
}

export interface ParcelAction {
  label: string;
  icon: string;
  action: string;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'danger' | 'warning';
}

// Status configuration for UI
export const StatusConfig = {
  [ParcelStatus.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    icon: 'edit',
  },
  [ParcelStatus.PROCESSING]: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: 'clock',
  },
  [ParcelStatus.PAYMENT_PENDING]: {
    label: 'Payment Pending',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: 'alert-circle',
  },
  [ParcelStatus.PAYMENT_CONFIRMED]: {
    label: 'Payment Confirmed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: 'check-circle',
  },
  [ParcelStatus.PICKED_UP]: {
    label: 'Picked Up',
    color:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    icon: 'package',
  },
  [ParcelStatus.IN_TRANSIT]: {
    label: 'In Transit',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    icon: 'truck',
  },
  [ParcelStatus.OUT_FOR_DELIVERY]: {
    label: 'Out for Delivery',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    icon: 'map-pin',
  },
  [ParcelStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: 'check-circle',
  },
  [ParcelStatus.DELAYED]: {
    label: 'Delayed',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: 'alert-circle',
  },
  [ParcelStatus.RETURNED]: {
    label: 'Returned',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    icon: 'arrow-left',
  },
  [ParcelStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: 'x-circle',
  },
};
