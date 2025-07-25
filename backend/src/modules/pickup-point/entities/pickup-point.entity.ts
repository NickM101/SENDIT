import { PickupPointType, KenyanCounty } from '@prisma/client';

export class PickupPointEntity {
  id: string;
  name: string;
  type: PickupPointType;
  address: string;
  city: string;
  county: KenyanCounty;
  latitude: number;
  longitude: number;
  hours: string;
  phone?: string;
  email?: string;
  services: string[];
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
