// src/modules/parcel/services/parcel-query.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { Parcel, ParcelStatus, Prisma } from '@prisma/client';

@Injectable()
export class ParcelQueryService {
  private readonly logger = new Logger(ParcelQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get parcels by user (sent parcels)
   */
  async getParcelsByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: ParcelStatus,
    trackingNumber?: string,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        senderId: userId,
        deletedAt: null,
        ...(status && { status }),
        ...(trackingNumber && { trackingNumber: { contains: trackingNumber } }),
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      };
      const [parcels, total] = await Promise.all([
        this.prisma.parcel.findMany({
          where,
          skip,
          take: limit,
          include: {
            recipientAddress: {
              select: { city: true, county: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.parcel.count({ where }),
      ]);
      return {
        parcels,
        pagination: {
          page,
          limit,
          total,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get parcels for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve parcels');
    }
  }

  /**
   * Get parcels ready for courier assignment
   */
  async getParcelsForAssignment(query: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;
      const where: Prisma.ParcelWhereInput = {
        deletedAt: null,
        status: {
          in: query.status
            ? [query.status as ParcelStatus]
            : [ParcelStatus.PAYMENT_CONFIRMED, ParcelStatus.PROCESSING],
        },
      };
      // Add date filters if provided
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }
      const [parcels, total] = await Promise.all([
        this.prisma.parcel.findMany({
          where,
          skip,
          take: limit,
          include: {
            sender: {
              select: { id: true, name: true, email: true, phone: true },
            },
            recipient: {
              select: { id: true, name: true, email: true, phone: true },
            },
            senderAddress: {
              select: {
                street: true,
                area: true,
                city: true,
                county: true,
                latitude: true,
                longitude: true,
              },
            },
            recipientAddress: {
              select: {
                street: true,
                area: true,
                city: true,
                county: true,
                latitude: true,
                longitude: true,
              },
            },
            dimensions: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.parcel.count({ where }),
      ]);
      // Transform data for frontend
      const transformedParcels = parcels.map((parcel) => ({
        id: parcel.id,
        trackingNumber: parcel.trackingNumber,
        senderName: parcel.sender.name,
        recipientName: parcel.recipient?.name,
        weight: parcel.weight,
        weightUnit: parcel.weightUnit,
        status: parcel.status,
        createdAt: parcel.createdAt,
        pickupAddress: parcel.senderAddress,
        deliveryAddress: parcel.recipientAddress,
        estimatedDelivery: parcel.estimatedDelivery,
        packageType: parcel.packageType,
        totalPrice: parcel.totalPrice,
      }));
      return {
        data: transformedParcels,
        pagination: {
          page,
          limit,
          total,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get parcels for assignment', error);
      throw new BadRequestException(
        'Failed to retrieve parcels for assignment',
      );
    }
  }
}
