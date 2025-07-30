// src/modules/parcel/services/parcel-query.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { Parcel, ParcelStatus, Prisma } from '@prisma/client';
import { ParcelStatsDto } from '../dto/parcel.dto';
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';

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
            // Include full recipient details (id, name, email, phone)
            recipient: true,
            // Include full sender details (id, name, email, phone)
            sender: true,
            // Include full recipient address details
            recipientAddress: true,
            // Include dimensions relation
            dimensions: true,
            // senderAddress is not required by the interface, but can be included if needed elsewhere
            // senderAddress: true,
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
      this.logger.error(
        `Failed to get parcels for user ${userId}`,
        error.stack,
      );
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
  }): Promise<{ data: Parcel[]; pagination: any }> {
    // Specify return type
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // --- Build Prisma Where Clause ---
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
      // --- End Build Where Clause ---

      // --- Prisma Query with Required Includes ---
      const [parcels, total] = await Promise.all([
        this.prisma.parcel.findMany({
          where,
          skip,
          take: limit,
          // Include all necessary relations and fields for the Parcel interface
          include: {
            // Full recipient details (id, name, email, phone)
            recipient: {
              select: { id: true, name: true, email: true, phone: true },
            },
            sender: {
              select: { id: true, name: true, email: true, phone: true },
            },
            recipientAddress: true,
            senderAddress: true,
            dimensions: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.parcel.count({ where }),
      ]);
      // --- End Prisma Query ---

      // --- Transform Prisma Result to Match Parcel Interface ---
      const transformedParcels: any[] = parcels.map((parcel) => {
        const recipientData = parcel.recipient ?? {
          id: '',
          name: 'Unknown',
          email: '',
          phone: '',
        };

        return {
          id: parcel.id,
          trackingNumber: parcel.trackingNumber,
          description: parcel.description ?? '', // Provide default if null/undefined
          status: parcel.status,
          totalPrice: parcel.totalPrice,
          currency: parcel.currency,
          weight: parcel.weight ?? undefined, // Map null to undefined if preferred
          weightUnit: parcel.weightUnit ?? undefined,
          createdAt: parcel.createdAt,
          estimatedDelivery: parcel.estimatedDelivery ?? undefined,
          actualDelivery: parcel.actualDelivery ?? undefined,
          // --- Recipient Object ---
          recipient: {
            id: recipientData.id,
            name: recipientData.name,
            email: recipientData.email,
            phone: recipientData.phone,
            // --- Recipient Address Object ---
            address: {
              street: parcel.recipientAddress?.street ?? '',
              city: parcel.recipientAddress?.city ?? '',
              state: parcel.recipientAddress?.state ?? '', // Assuming 'state' exists in Address model
              country: parcel.recipientAddress?.country ?? 'Kenya', // Default from schema
              // Note: The interface asks for 'state' and 'country', but Prisma schema has 'county' and 'country'.
              // Using 'state' as it's in the interface. If 'county' is needed, adjust accordingly.
            },
          },
          // --- Sender Object ---
          sender: {
            id: parcel.sender.id,
            name: parcel.sender.name,
            email: parcel.sender.email,
            phone: parcel.sender.phone,
          },
          packageType: parcel.packageType,
          deliveryType: parcel.deliveryType,
          // --- Dimensions Object ---
          dimensions: parcel.dimensions
            ? {
                length: parcel.dimensions.length,
                width: parcel.dimensions.width,
                height: parcel.dimensions.height,
                unit: parcel.dimensions.unit,
              }
            : undefined, // Map null to undefined if dimensions don't exist
        };
      });
      // --- End Transformation ---

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
      this.logger.error('Failed to get parcels for assignment', error.stack); // Log stack trace
      throw new BadRequestException(
        'Failed to retrieve parcels for assignment',
      );
    }
  }

  async getParcelStats(userId: string): Promise<ParcelStatsDto> {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);

      // --- Total Parcels Sent by User ---
      const totalSent = await this.prisma.parcel.count({
        where: {
          senderId: userId,
          deletedAt: null,
        },
      });

      // --- Parcels Sent Last Month by User (for growth calculation) ---
      const totalSentLastMonth = await this.prisma.parcel.count({
        where: {
          senderId: userId,
          deletedAt: null,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      });

      // --- Calculate Monthly Growth for Sent Parcels ---
      let monthlyGrowth = 0;
      if (totalSentLastMonth > 0) {
        monthlyGrowth = parseFloat(
          (
            ((totalSent - totalSentLastMonth) / totalSentLastMonth) *
            100
          ).toFixed(2),
        );
      } else if (totalSent > 0 && totalSentLastMonth === 0) {
        // If user sent parcels this month but none last month, growth is effectively 100% or more
        // For simplicity, we'll represent it as a large positive number or handle as needed.
        // Often, businesses might show N/A or a specific message. Here, we'll use 100 if they sent any.
        monthlyGrowth = totalSent > 0 ? 100 : 0;
      }
      // If no parcels sent in either period, growth remains 0.

      // --- Total Parcels Received by User ---
      const totalReceived = await this.prisma.parcel.count({
        where: {
          recipientId: userId,
          deletedAt: null,
        },
      });

      // --- Pending Deliveries for User (as Sender or Recipient?) ---
      // Assuming "Pending" means parcels the user sent that are not yet delivered/cancelled/returned/refunded
      const pendingStatuses: ParcelStatus[] = [
        ParcelStatus.PROCESSING,
        ParcelStatus.PAYMENT_PENDING,
        ParcelStatus.PAYMENT_CONFIRMED,
        ParcelStatus.PICKED_UP,
        ParcelStatus.IN_TRANSIT,
        ParcelStatus.OUT_FOR_DELIVERY,
        ParcelStatus.DELAYED, // Often still considered pending
        // Add others if needed based on business logic
      ];

      const pending = await this.prisma.parcel.count({
        where: {
          OR: [
            // Parcels sent by the user that are pending
            {
              senderId: userId,
              status: { in: pendingStatuses },
              deletedAt: null,
            },
            // Parcels received by the user that are pending (e.g., OUT_FOR_DELIVERY)
            {
              recipientId: userId,
              status: { in: pendingStatuses },
              deletedAt: null,
            },
          ],
        },
      });

      // --- Successfully Delivered Today (to the user as recipient?) ---
      // Assuming "Delivered Today" refers to parcels delivered *to* the user today.
      const delivered = await this.prisma.parcel.count({
        where: {
          recipientId: userId,
          status: ParcelStatus.DELIVERED,
          actualDelivery: {
            gte: startOfToday,
            lte: endOfToday,
          },
          deletedAt: null,
        },
      });

      // If you meant parcels *sent* by the user that were delivered today:
      /*
      const delivered = await this.prisma.parcel.count({
        where: {
          senderId: userId,
          status: ParcelStatus.DELIVERED,
          actualDelivery: {
            gte: startOfToday,
            lte: endOfToday,
          },
          deletedAt: null,
        },
      });
      */

      return {
        totalSent,
        totalReceived,
        pending,
        delivered,
        monthlyGrowth,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get parcel stats for user ${userId}`,
        error.stack,
      );
      // Depending on your error handling strategy, you might throw a specific exception
      // or return default stats. Throwing is generally better for APIs.
      throw error; // Or throw new InternalServerErrorException('Failed to retrieve stats');
    }
  }
}
