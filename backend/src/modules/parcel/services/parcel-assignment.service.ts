// src/modules/parcel/services/parcel-assignment.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import {
  Parcel,
  ParcelStatus,
  Role,
  NotificationType,
  NotificationStatus,
} from '@prisma/client';

@Injectable()
export class ParcelAssignmentService {
  private readonly logger = new Logger(ParcelAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign courier to parcel (enhanced version)
   */
  async assignCourier(
    parcelId: string,
    courierId: string,
    adminId: string,
    instructions?: string,
  ): Promise<Parcel> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Verify courier exists and is active
        const courier = await prisma.user.findFirst({
          where: {
            id: courierId,
            role: Role.COURIER,
            isActive: true,
            deletedAt: null,
          },
        });
        if (!courier) {
          throw new BadRequestException('Invalid or inactive courier');
        }
        // Verify parcel exists and is ready for assignment
        const parcel = await prisma.parcel.findFirst({
          where: {
            id: parcelId,
            deletedAt: null,
            status: {
              in: [ParcelStatus.PAYMENT_CONFIRMED, ParcelStatus.PROCESSING],
            },
          },
        });
        if (!parcel) {
          throw new BadRequestException(
            'Parcel not found or not ready for assignment',
          );
        }
        // Update parcel with courier assignment
        const updatedParcel = await prisma.parcel.update({
          where: { id: parcelId },
          data: {
            status: ParcelStatus.PICKED_UP,
            updatedBy: adminId,
            pickupInstructions: instructions
              ? `${parcel.pickupInstructions || ''}
Admin Note: ${instructions}`.trim()
              : parcel.pickupInstructions,
          },
          include: {
            sender: true,
            recipient: true,
            senderAddress: true,
            recipientAddress: true,
            dimensions: true,
          },
        });
        // Create courier assignment record (if you have a CourierAssignment table)
        await prisma.courierAssignment.create({
          data: {
            parcelId,
            courierId,
            assignedBy: adminId,
            assignedAt: new Date(),
            status: 'ACTIVE'
          }
        });

        // Create tracking history
        await prisma.trackingHistory.create({
          data: {
            parcelId,
            status: ParcelStatus.PICKED_UP,
            description: `Assigned to courier ${courier.name}`,
            location: updatedParcel.senderAddress.city,
            updatedBy: adminId,
          },
        });

        // Send notification to courier
        await prisma.notification.create({
          data: {
            userId: courierId,
            parcelId,
            type: NotificationType.PUSH,
            status: NotificationStatus.PENDING,
            subject: 'New Delivery Assignment',
            message: `You have been assigned parcel ${updatedParcel.trackingNumber}. Pickup from ${updatedParcel.senderAddress.area}, ${updatedParcel.senderAddress.city}.`,
            recipient: courier.email,
            queuedAt: new Date(),
          },
        });

        // Send notification to sender
        if (updatedParcel.sender) {
          await prisma.notification.create({
            data: {
              userId: updatedParcel.senderId,
              parcelId,
              type: NotificationType.EMAIL,
              status: NotificationStatus.PENDING,
              subject: 'Your parcel is ready for pickup',
              message: `Your parcel ${updatedParcel.trackingNumber} has been assigned to a courier and will be picked up soon.`,
              recipient: updatedParcel.sender.email,
              queuedAt: new Date(),
            },
          });
        }

        this.logger.log(`Parcel ${parcelId} assigned to courier ${courierId}`);
        return updatedParcel;
      });
    } catch (error) {
      this.logger.error('Failed to assign courier', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign courier to parcel');
    }
  }
}
