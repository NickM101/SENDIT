// src/modules/parcel/services/parcel-tracking.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import {
  Parcel,
  ParcelStatus,
  NotificationType,
  NotificationStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ParcelTrackingService {
  private readonly logger = new Logger(ParcelTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get parcel by tracking number
   */
  async getParcelByTrackingNumber(trackingNumber: string): Promise<Parcel> {
    try {
      const parcel = await this.prisma.parcel.findUnique({
        where: { trackingNumber },
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
          trackingHistory: {
            orderBy: { timestamp: 'desc' },
          },
          deliveryAttempts: {
            orderBy: { attemptDate: 'desc' },
          },
        },
      });
      if (!parcel) {
        throw new NotFoundException(
          `Parcel with tracking number ${trackingNumber} not found`,
        );
      }
      return parcel;
    } catch (error) {
      this.logger.error(
        `Failed to get parcel by tracking number: ${trackingNumber}`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve parcel');
    }
  }

  /**
   * Update parcel status with validation
   */
  async updateParcelStatus(
    parcelId: string,
    status: ParcelStatus,
    description?: string,
    location?: string,
    updatedBy?: string,
    coordinates?: { latitude: number; longitude: number },
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Validate status transition
        const parcel = await prisma.parcel.findUnique({
          where: { id: parcelId },
          select: { status: true, recipientId: true },
        });
        if (!parcel) {
          throw new NotFoundException('Parcel not found');
        }

        // Define valid status transitions
        const validTransitions: { [key in ParcelStatus]?: ParcelStatus[] } = {
          [ParcelStatus.PROCESSING]: [
            ParcelStatus.PAYMENT_PENDING,
            ParcelStatus.PAYMENT_CONFIRMED,
          ],
          [ParcelStatus.PAYMENT_PENDING]: [
            ParcelStatus.PAYMENT_CONFIRMED,
            ParcelStatus.CANCELLED,
          ],
          [ParcelStatus.PAYMENT_CONFIRMED]: [
            ParcelStatus.PICKED_UP,
            ParcelStatus.CANCELLED,
          ],
          [ParcelStatus.PICKED_UP]: [
            ParcelStatus.IN_TRANSIT,
            ParcelStatus.DELAYED,
          ],
          [ParcelStatus.IN_TRANSIT]: [
            ParcelStatus.OUT_FOR_DELIVERY,
            ParcelStatus.DELAYED,
          ],
          [ParcelStatus.OUT_FOR_DELIVERY]: [
            ParcelStatus.DELIVERED,
            ParcelStatus.DELAYED,
            ParcelStatus.RETURNED,
          ],
          [ParcelStatus.DELAYED]: [
            ParcelStatus.IN_TRANSIT,
            ParcelStatus.OUT_FOR_DELIVERY,
            ParcelStatus.RETURNED,
          ],
          [ParcelStatus.DELIVERED]: [], // Final status
          [ParcelStatus.RETURNED]: [ParcelStatus.REFUNDED],
          [ParcelStatus.CANCELLED]: [ParcelStatus.REFUNDED],
        };

        const allowedTransitions = validTransitions[parcel.status] || [];
        if (!allowedTransitions.includes(status)) {
          throw new BadRequestException(
            `Invalid status transition from ${parcel.status} to ${status}`,
          );
        }

        // Update parcel status
        await prisma.parcel.update({
          where: { id: parcelId },
          data: {
            status,
            updatedBy,
            ...(status === ParcelStatus.DELIVERED && {
              actualDelivery: new Date(),
            }),
          },
        });

        // Create tracking history entry
        await prisma.trackingHistory.create({
          data: {
            parcelId,
            status,
            description: description || `Status updated to ${status}`,
            location,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude,
            updatedBy,
          },
        });

        // Send notifications based on status
        if (status === ParcelStatus.OUT_FOR_DELIVERY && parcel.recipientId) {
          await prisma.notification.create({
            data: {
              userId: parcel.recipientId,
              parcelId,
              type: NotificationType.EMAIL,
              status: NotificationStatus.PENDING,
              subject: 'Your parcel is out for delivery',
              message:
                'Your parcel will be delivered today. Please ensure someone is available to receive it.',
              queuedAt: new Date(),
            },
          });
        }
        if (status === ParcelStatus.DELIVERED && parcel.recipientId) {
          await prisma.notification.create({
            data: {
              userId: parcel.recipientId,
              parcelId,
              type: NotificationType.EMAIL,
              status: NotificationStatus.PENDING,
              subject: 'Your parcel has been delivered',
              message:
                'Your parcel has been successfully delivered. Thank you for using SendIT!',
              queuedAt: new Date(),
            },
          });
        }
      });
      this.logger.log(`Parcel ${parcelId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update parcel status for ${parcelId}`,
        error,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update parcel status');
    }
  }

  /**
   * Get courier workload statistics
   */
  async getCourierWorkload(courierId?: string) {
    try {
      const where: Prisma.ParcelWhereInput = {
        deletedAt: null,
        status: {
          in: [
            ParcelStatus.PICKED_UP,
            ParcelStatus.IN_TRANSIT,
            ParcelStatus.OUT_FOR_DELIVERY,
          ],
        },
        // Note: You'll need to add a courierId field to the Parcel model
        // or create a CourierAssignment table to track assignments
        // If you have a courierId field on Parcel:
        // ...(courierId && { courierId }),
      };

      const activeDeliveries = await this.prisma.parcel.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      });

      return activeDeliveries;
    } catch (error) {
      this.logger.error('Failed to get courier workload', error);
      throw new BadRequestException('Failed to retrieve courier workload');
    }
  }
}
