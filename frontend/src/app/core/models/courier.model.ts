export interface Courier {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BUSY';
  currentWorkload: number;
  maxCapacity: number;
  rating: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance?: number;
}

export interface CourierSearchParams {
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  maxDistance?: number;
  availableOnly?: boolean;
}
