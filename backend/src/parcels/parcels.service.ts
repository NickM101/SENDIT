import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelStatusDto } from './dto/update-parcel-status.dto';
import { Role, ParcelStatus, Dimensions } from '@prisma/client';

@Injectable()
export class ParcelsService {
  constructor(private prisma: PrismaService) {}

  private calculatePrice(weight: number, deliveryType: string = 'STANDARD'): number {
    let basePrice: number;
    
    // Weight-based pricing
    if (weight < 1) basePrice = 15;
    else if (weight <= 5) basePrice = 25;
    else if (weight <= 20) basePrice = 45;
    else basePrice = 75;

    // Delivery type multiplier
    const multipliers = {
      STANDARD: 1,
      EXPRESS: 1.5,
      SAME_DAY: 2.5,
      OVERNIGHT: 2
    };

    return basePrice * (multipliers[deliveryType] || 1);
  }

  private generateTrackingNumber(): string {
    const prefix = 'ST-';
    const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return prefix + number;
  }

  async createParcel(createParcelDto: CreateParcelDto, senderId: string) {
    const {
      recipientName,
      recipientEmail,
      recipientPhone,
      senderAddress,
      recipientAddress,
      packageType,
      weight,
      dimensions,
      deliveryType = 'STANDARD',
      estimatedValue,
      description,
      insuranceCoverage = 'NO_INSURANCE',
      imageUrl,
    } = createParcelDto;

    // Create or find recipient
    let recipient = await this.prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    if (!recipient) {
      recipient = await this.prisma.user.create({
        data: {
          email: recipientEmail,
          name: recipientName,
          phone: recipientPhone,
          password: '', // Temporary - user needs to register
        },
      });
    }

    // Create addresses
    const senderAddr = await this.prisma.address.create({
      data: senderAddress,
    });

    const recipientAddr = await this.prisma.address.create({
      data: recipientAddress,
    });

    // Create dimensions if provided
    let dimensionsRecord: Dimensions | null = null;
    if (dimensions) {
      dimensionsRecord = await this.prisma.dimensions.create({
        data: dimensions,
      });
    }

    const trackingNumber = this.generateTrackingNumber();
    const basePrice = this.calculatePrice(weight, deliveryType);
    
    // Calculate additional fees
    let additionalFees = 0;
    if (insuranceCoverage !== 'NO_INSURANCE') {
      additionalFees += basePrice * 0.1; // 10% insurance fee
    }

    const totalPrice = basePrice + additionalFees;

    const parcel = await this.prisma.parcel.create({
      data: {
        trackingNumber,
        senderId,
        recipientId: recipient.id,
        senderAddressId: senderAddr.id,
        recipientAddressId: recipientAddr.id,
        ...(dimensionsRecord && { dimensionsId: dimensionsRecord.id }),
        packageType,
        deliveryType,
        basePrice,
        additionalFees,
        totalPrice,
        estimatedValue,
        description,
        insuranceCoverage,
        imageUrl,
        paymentStatus,
        createdBy: senderId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, phone: true },
        },
        recipient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        senderAddress: true,
        recipientAddress: true,
        dimensions: true,
      },
    });

    // Create initial tracking history
    await this.prisma.trackingHistory.create({
      data: {
        parcelId: parcel.id,
        status: ParcelStatus.PROCESSING,
        description: 'Parcel created and processing',
        updatedBy: senderId,
      },
    });

    return parcel;
  }

  async findAllParcels(userId: string, userRoles: Role[], page = 1, limit = 10, filters: any = {}) {
    const isAdmin = userRoles.includes(Role.ADMIN);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (!isAdmin) {
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    }

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.trackingNumber) {
      where.trackingNumber = { contains: filters.trackingNumber, mode: 'insensitive' };
    }
    if (filters.dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
    }

    const [parcels, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, email: true } },
          recipient: { select: { id: true, name: true, email: true } },
          senderAddress: true,
          recipientAddress: true,
          trackingHistory: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      parcels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateParcelStatus(id: string, status: ParcelStatus, updatedBy: string, location?: string, description?: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        sender: true,
        recipient: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    // Update parcel
    const updatedParcel = await this.prisma.parcel.update({
      where: { id },
      data: { 
        updatedBy,
        ...(status === ParcelStatus.DELIVERED && { actualDelivery: new Date() }),
      },
    });

    // Create tracking history entry
    await this.prisma.trackingHistory.create({
      data: {
        parcelId: id,
        status,
        location,
        description,
        updatedBy,
      },
    });

    return updatedParcel;
  }

  async trackParcel(trackingNumber: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingNumber },
      include: {
        sender: { select: { name: true, email: true } },
        recipient: { select: { name: true, email: true } },
        senderAddress: true,
        recipientAddress: true,
        dimensions: true,
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    return parcel;
  }
}