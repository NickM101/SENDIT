// src/modules/parcels/send-parcel/send-parcel.service.ts
import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SendParcelService {
  constructor(private readonly prisma: PrismaService) {}

  async createParcel(data: any, user: string) {
    return this.prisma.parcel.create({
      data,
    });
  }

  async initializeSession(userId: string) {
    // Load user profile data for pre-filling
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    // Get package types and service options
    const packageTypes = await this.getPackageTypes();
    const serviceOptions = await this.getServiceOptions();

    return {
      userProfile: user,
      packageTypes,
      serviceOptions,
      defaultSettings: {
        currency: 'USD',
        weightUnit: 'kg',
        dimensionUnit: 'cm',
      },
    };
  }

  async getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: {
        createdBy: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getRecentRecipients(userId: string) {
    // Get recent recipients from user's parcel history
    return this.prisma.parcel.findMany({
      where: {
        senderId: userId,
        deletedAt: null,
      },
      select: {
        recipientAddress: {
          select: {
            name: true,
            email: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        },
      },
      distinct: ['recipientAddressId'],
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async validateStep(stepNumber: number, data: any, user: string) {
    // Implement validation logic here
  }

  private async getPackageTypes() {
    // Return available package types
    return [
      { id: 'STANDARD_BOX', label: 'Standard Box', icon: 'box' },
      { id: 'DOCUMENT', label: 'Document', icon: 'file-text' },
      { id: 'CLOTHING', label: 'Clothing', icon: 'shirt' },
      { id: 'ELECTRONICS', label: 'Electronics', icon: 'smartphone' },
      { id: 'FRAGILE', label: 'Fragile', icon: 'shield-alert' },
      { id: 'LIQUID', label: 'Liquid', icon: 'droplet' },
      { id: 'PERISHABLE', label: 'Perishable', icon: 'refrigerator' },
    ];
  }

  private async getServiceOptions() {
    return [
      {
        id: 'STANDARD',
        label: 'Standard Delivery',
        description: '3-5 business days',
        priceMultiplier: 1.0,
      },
      {
        id: 'EXPRESS',
        label: 'Express Delivery',
        description: '1-2 business days',
        priceMultiplier: 1.5,
      },
      {
        id: 'SAME_DAY',
        label: 'Same Day Delivery',
        description: 'Within 8 hours',
        priceMultiplier: 2.0,
      },
    ];
  }
}
