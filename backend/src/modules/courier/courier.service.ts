// src/modules/courier/courier.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { UploadsService } from '@app/modules/uploads/uploads.service';
import {
  CourierDelivery,
  DeliveryStatusUpdate,
  CourierEarnings,
  DeliveryFilters,
  CourierStats,
} from './dto/courier.dto';
import { PriorityEnum } from './dto/courier.dto';
import {
  ParcelStatus,
  CourierAssignmentStatus,
  AttemptStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CourierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Get all deliveries assigned to the current courier
   */
  async getMyDeliveries(
    courierId: string,
    filters?: DeliveryFilters,
  ): Promise<CourierDelivery[]> {
    const where: any = {
      CourierAssignment: {
        some: {
          courierId,
          status: CourierAssignmentStatus.ACTIVE,
        },
      },
      deletedAt: null,
    };

    // Apply filters
    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { trackingNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sender: { name: { contains: filters.search, mode: 'insensitive' } } },
        {
          senderAddress: {
            city: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (filters?.dateFrom && filters?.dateTo) {
      where.createdAt = {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      };
    }

    if (filters?.type === 'PICKUP') {
      where.status = { in: ['PROCESSING', 'PAYMENT_CONFIRMED'] };
    } else if (filters?.type === 'DELIVERY') {
      where.status = { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] };
    }

    const parcels = await this.prisma.parcel.findMany({
      where,
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
        CourierAssignment: {
          where: { courierId, status: CourierAssignmentStatus.ACTIVE },
          include: {
            assignedByUser: { select: { name: true } },
          },
        },
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        deliveryAttempts: {
          orderBy: { attemptDate: 'desc' },
        },
      },
      orderBy: [{ estimatedDelivery: 'asc' }, { createdAt: 'desc' }],
    });

    return parcels.map((parcel) => this.mapToDeliveryDto(parcel));
  }

  /**
   * Get delivery details by ID
   */
  async getDeliveryById(
    deliveryId: string,
    courierId: string,
  ): Promise<CourierDelivery> {
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        id: deliveryId,
        CourierAssignment: {
          some: {
            courierId,
            status: CourierAssignmentStatus.ACTIVE,
          },
        },
        deletedAt: null,
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
        CourierAssignment: {
          where: { courierId, status: CourierAssignmentStatus.ACTIVE },
          include: {
            assignedByUser: { select: { name: true } },
          },
        },
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
        `Delivery with ID ${deliveryId} not found or not assigned to courier`,
      );
    }

    return this.mapToDeliveryDto(parcel);
  }

  /**
   * Update delivery status with optional file upload
   */
  async updateDeliveryStatus(
    deliveryId: string,
    courierId: string,
    updateData: DeliveryStatusUpdate,
    file?: Express.Multer.File,
  ): Promise<CourierDelivery> {
    // Verify courier has access to this delivery
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        id: deliveryId,
        CourierAssignment: {
          some: {
            courierId,
            status: CourierAssignmentStatus.ACTIVE,
          },
        },
        deletedAt: null,
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        'Delivery not found or not assigned to courier',
      );
    }

    // Validate status transition
    this.validateStatusTransition(
      parcel.status,
      updateData.status as ParcelStatus,
    );

    let deliveryPhotoUrl: string | undefined;

    // Handle file upload if provided
    if (file) {
      deliveryPhotoUrl = await this.uploadsService.uploadImage(file);
    }

    // Update parcel status
    const updatedParcel = await this.prisma.parcel.update({
      where: { id: deliveryId },
      data: {
        status: updateData.status as ParcelStatus,
        ...(updateData.status === 'DELIVERED' && {
          actualDelivery: new Date(),
        }),
      },
      include: {
        sender: { select: { id: true, name: true, email: true, phone: true } },
        recipient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        senderAddress: true,
        recipientAddress: true,
        dimensions: true,
        CourierAssignment: {
          where: { courierId, status: CourierAssignmentStatus.ACTIVE },
        },
        trackingHistory: { orderBy: { timestamp: 'desc' }, take: 5 },
        deliveryAttempts: { orderBy: { attemptDate: 'desc' } },
      },
    });

    // Create tracking history entry
    await this.prisma.trackingHistory.create({
      data: {
        parcelId: deliveryId,
        status: updateData.status as ParcelStatus,
        location: updateData.location,
        description: updateData.description,
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        updatedBy: courierId,
      },
    });

    // Create delivery attempt if this is a delivery-related status
    if (['DELIVERED', 'DELAYED', 'RETURNED'].includes(updateData.status)) {
      const attemptStatus = this.mapStatusToAttemptStatus(
        updateData.status,
        updateData.courierNotes,
      );

      await this.prisma.deliveryAttempt.create({
        data: {
          parcelId: deliveryId,
          status: attemptStatus,
          reason: updateData.courierNotes,
          courierNotes: updateData.courierNotes,
          latitude: updateData.latitude,
          longitude: updateData.longitude,
          ...(updateData.status === 'DELAYED' && {
            nextAttempt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
          }),
        },
      });
    }

    // Complete courier assignment if delivered
    if (updateData.status === 'DELIVERED') {
      await this.prisma.courierAssignment.updateMany({
        where: {
          parcelId: deliveryId,
          courierId,
          status: CourierAssignmentStatus.ACTIVE,
        },
        data: {
          status: CourierAssignmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    // Send notifications
    await this.notificationService.sendStatusUpdateNotification(updatedParcel);

    return this.mapToDeliveryDto(updatedParcel);
  }

  /**
   * Get courier earnings summary
   */
  async getCourierEarnings(courierId: string): Promise<CourierEarnings> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Daily earnings
    const dailyDeliveries = await this.prisma.courierAssignment.findMany({
      where: {
        courierId,
        status: CourierAssignmentStatus.COMPLETED,
        completedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: { parcel: true },
    });

    // Weekly earnings
    const weeklyDeliveries = await this.prisma.courierAssignment.findMany({
      where: {
        courierId,
        status: CourierAssignmentStatus.COMPLETED,
        completedAt: { gte: weekStart },
      },
      include: { parcel: true },
    });

    // Monthly earnings
    const monthlyDeliveries = await this.prisma.courierAssignment.findMany({
      where: {
        courierId,
        status: CourierAssignmentStatus.COMPLETED,
        completedAt: { gte: monthStart },
      },
      include: { parcel: true },
    });

    return {
      daily: {
        date: today,
        totalEarnings: this.calculateEarnings(dailyDeliveries),
        deliveriesCompleted: dailyDeliveries.length,
        pickupsCompleted: dailyDeliveries.filter(
          (d) => d.parcel.status === 'PICKED_UP',
        ).length,
        bonusEarnings: this.calculateBonusEarnings(dailyDeliveries),
      },
      weekly: {
        weekStart,
        totalEarnings: this.calculateEarnings(weeklyDeliveries),
        deliveriesCompleted: weeklyDeliveries.length,
        pickupsCompleted: weeklyDeliveries.filter(
          (d) => d.parcel.status === 'PICKED_UP',
        ).length,
        averageRating: 4.5, // Placeholder - would calculate from actual ratings
      },
      monthly: {
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        totalEarnings: this.calculateEarnings(monthlyDeliveries),
        deliveriesCompleted: monthlyDeliveries.length,
        pickupsCompleted: monthlyDeliveries.filter(
          (d) => d.parcel.status === 'PICKED_UP',
        ).length,
      },
    };
  }

  /**
   * Get today's delivery route
   */
  async getTodayRoute(courierId: string): Promise<CourierDelivery[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getMyDeliveries(courierId, {
      dateFrom: today,
      dateTo: tomorrow,
    });
  }

  /**
   * Get courier statistics
   */
  async getCourierStats(courierId: string): Promise<CourierStats> {
    const totalAssignments = await this.prisma.courierAssignment.count({
      where: { courierId },
    });

    const completedAssignments = await this.prisma.courierAssignment.count({
      where: { courierId, status: CourierAssignmentStatus.COMPLETED },
    });

    const activeAssignments = await this.prisma.courierAssignment.count({
      where: { courierId, status: CourierAssignmentStatus.ACTIVE },
    });

    const totalEarnings = await this.calculateTotalEarnings(courierId);

    return {
      totalDeliveries: totalAssignments,
      completedDeliveries: completedAssignments,
      activeDeliveries: activeAssignments,
      successRate:
        totalAssignments > 0
          ? (completedAssignments / totalAssignments) * 100
          : 0,
      totalEarnings,
      averageRating: 4.5, // Placeholder
    };
  }

  /**
   * Private helper methods
   */
  private mapToDeliveryDto(parcel: any): CourierDelivery {
    const assignment = parcel.courierAssignment?.[0];

    return {
      id: parcel.id,
      trackingNumber: parcel.trackingNumber,
      status: parcel.status,
      packageType: parcel.packageType,
      deliveryType: parcel.deliveryType,
      weight: parcel.weight || 0,
      weightUnit: parcel.weightUnit || 'kg',
      estimatedValue: parcel.estimatedValue || 0,
      description: parcel.description || '',
      totalPrice: parcel.totalPrice,
      currency: parcel.currency,
      sender: parcel.sender,
      recipient: parcel.recipient,
      senderAddress: parcel.senderAddress,
      recipientAddress: parcel.recipientAddress,
      pickupDate: parcel.pickupDate,
      pickupTimeSlot: parcel.pickupTimeSlot,
      deliveryDate: parcel.deliveryDate,
      estimatedDelivery: parcel.estimatedDelivery,
      actualDelivery: parcel.actualDelivery,
      pickupInstructions: parcel.pickupInstructions,
      deliveryInstructions: parcel.deliveryInstructions,
      specialHandling: parcel.specialHandling,
      fragile: parcel.fragile,
      perishable: parcel.perishable,
      hazardousMaterial: parcel.hazardousMaterial,
      highValue: parcel.highValue,
      signatureRequired: parcel.signatureRequired,
      courierAssignment: assignment
        ? {
            id: assignment.id,
            assignedAt: assignment.assignedAt,
            status: assignment.status,
            completedAt: assignment.completedAt,
          }
        : undefined,
      trackingHistory: parcel.trackingHistory,
      deliveryAttempts: parcel.deliveryAttempts,
      distance: this.calculateDistance(
        parcel.senderAddress,
        parcel.recipientAddress,
      ),
      estimatedEarnings: this.calculateDeliveryEarnings(parcel),
      priority: this.determinePriority(parcel),
      createdAt: parcel.createdAt,
      updatedAt: parcel.updatedAt,
    };
  }

  private validateStatusTransition(
    currentStatus: ParcelStatus,
    newStatus: ParcelStatus,
  ): void {
    const validTransitions: Record<ParcelStatus, ParcelStatus[]> = {
      PROCESSING: ['PICKED_UP', 'CANCELLED'],
      PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'CANCELLED'],
      PAYMENT_CONFIRMED: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['IN_TRANSIT', 'DELIVERED', 'RETURNED'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELAYED', 'RETURNED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'DELAYED', 'RETURNED'],
      DELIVERED: [], // Terminal state
      DELAYED: ['OUT_FOR_DELIVERY', 'RETURNED'],
      RETURNED: [], // Terminal state
      CANCELLED: [], // Terminal state
      DRAFT: ['PROCESSING'],
      REFUNDED: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private mapStatusToAttemptStatus(
    status: string,
    notes?: string,
  ): AttemptStatus {
    switch (status) {
      case 'DELIVERED':
        return AttemptStatus.SUCCESSFUL;
      case 'DELAYED':
        if (notes?.toLowerCase().includes('no one home')) {
          return AttemptStatus.FAILED_NO_ONE_HOME;
        }
        if (notes?.toLowerCase().includes('wrong address')) {
          return AttemptStatus.FAILED_INCORRECT_ADDRESS;
        }
        if (notes?.toLowerCase().includes('refused')) {
          return AttemptStatus.FAILED_REFUSED;
        }
        return AttemptStatus.FAILED_OTHER;
      default:
        return AttemptStatus.FAILED_OTHER;
    }
  }

  private calculateDistance(fromAddress: any, toAddress: any): number {
    if (
      !fromAddress?.latitude ||
      !fromAddress?.longitude ||
      !toAddress?.latitude ||
      !toAddress?.longitude
    ) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(toAddress.latitude - fromAddress.latitude);
    const dLon = this.deg2rad(toAddress.longitude - fromAddress.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(fromAddress.latitude)) *
        Math.cos(this.deg2rad(toAddress.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateDeliveryEarnings(parcel: any): number {
    let baseEarning = 50; // KES 50 base

    // Distance-based earning
    const distance = this.calculateDistance(
      parcel.senderAddress,
      parcel.recipientAddress,
    );
    baseEarning += distance * 10;

    // Delivery type multiplier
    switch (parcel.deliveryType) {
      case 'EXPRESS':
        baseEarning *= 1.5;
        break;
      case 'SAME_DAY':
        baseEarning *= 2;
        break;
      case 'OVERNIGHT':
        baseEarning *= 1.3;
        break;
    }

    // Special handling bonus
    if (parcel.fragile || parcel.highValue) {
      baseEarning += 25;
    }

    return Math.round(baseEarning);
  }
  private determinePriority(parcel: any): PriorityEnum {
    if (
      parcel.deliveryType === 'SAME_DAY' ||
      parcel.deliveryType === 'EXPRESS'
    ) {
      return PriorityEnum.HIGH;
    }

    if (parcel.fragile || parcel.perishable || parcel.highValue) {
      return PriorityEnum.HIGH;
    }

    if (parcel.estimatedDelivery) {
      const hoursUntilDelivery =
        (new Date(parcel.estimatedDelivery).getTime() - new Date().getTime()) /
        (1000 * 60 * 60);
      if (hoursUntilDelivery <= 4) return PriorityEnum.HIGH;
      if (hoursUntilDelivery <= 24) return PriorityEnum.MEDIUM;
    }

    return PriorityEnum.LOW;
  }
  private calculateEarnings(assignments: any[]): number {
    return assignments.reduce((total, assignment) => {
      return total + this.calculateDeliveryEarnings(assignment.parcel);
    }, 0);
  }

  private calculateBonusEarnings(assignments: any[]): number {
    // Bonus for completing more than 5 deliveries in a day
    return assignments.length > 5 ? assignments.length * 10 : 0;
  }

  private async calculateTotalEarnings(courierId: string): Promise<number> {
    const allCompletedAssignments =
      await this.prisma.courierAssignment.findMany({
        where: {
          courierId,
          status: CourierAssignmentStatus.COMPLETED,
        },
        include: { parcel: true },
      });

    return this.calculateEarnings(allCompletedAssignments);
  }
}
