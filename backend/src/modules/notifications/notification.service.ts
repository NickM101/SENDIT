// src/modules/notifications/notification.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { NotificationType, NotificationStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send notification when parcel status is updated
   */
  async sendStatusUpdateNotification(parcel: any): Promise<void> {
    try {
      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          parcelId: parcel.id,
          userId: parcel.senderId,
          type: NotificationType.EMAIL,
          status: NotificationStatus.PENDING,
          subject: `Parcel ${parcel.trackingNumber} - Status Update`,
          message: `Your parcel status has been updated to: ${parcel.status}`,
          recipient: parcel.sender.email,
          queuedAt: new Date(),
        },
      });

      // Send email notification if user has email notifications enabled
      if (parcel.emailNotifications) {
        await this.emailService.sendStatusUpdateEmail(
          parcel.sender.email,
          parcel.sender.name,
          parcel.trackingNumber,
          parcel.status,
          `${process.env.FRONTEND_URL}/track/${parcel.trackingNumber}`,
        );

        // Update notification status
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
      }

      // Also notify recipient if status is relevant
      if (
        ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(parcel.status) &&
        parcel.recipient
      ) {
        await this.prisma.notification.create({
          data: {
            parcelId: parcel.id,
            userId: parcel.recipientId,
            type: NotificationType.EMAIL,
            status: NotificationStatus.PENDING,
            subject: `Parcel ${parcel.trackingNumber} - Delivery Update`,
            message: `A parcel addressed to you has been updated to: ${parcel.status}`,
            recipient: parcel.recipient.email,
            queuedAt: new Date(),
          },
        });

        await this.emailService.sendStatusUpdateEmail(
          parcel.recipient.email,
          parcel.recipient.name,
          parcel.trackingNumber,
          parcel.status,
          `${process.env.FRONTEND_URL}/track/${parcel.trackingNumber}`,
        );
      }
    } catch (error) {
      console.error('Error sending status update notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send delivery confirmation notification
   */
  async sendDeliveryConfirmationNotification(parcel: any): Promise<void> {
    try {
      // Notify sender
      await this.emailService.sendDeliveryConfirmationEmail(
        parcel.sender.email,
        parcel.sender.name,
        parcel.trackingNumber,
        parcel.actualDelivery,
      );

      // Notify recipient
      if (parcel.recipient) {
        await this.emailService.sendDeliveryConfirmationEmail(
          parcel.recipient.email,
          parcel.recipient.name,
          parcel.trackingNumber,
          parcel.actualDelivery,
        );
      }
    } catch (error) {
      console.error('Error sending delivery confirmation notification:', error);
    }
  }
}
