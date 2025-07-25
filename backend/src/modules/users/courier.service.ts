import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available couriers
   */
  async getAvailableCouriers(filters?: {
    isActive?: boolean;
    vehicleType?: string;
    maxLoad?: number;
  }) {
    try {
      const where: Prisma.UserWhereInput = {
        role: Role.COURIER,
        deletedAt: null,
        isActive: filters?.isActive ?? true,
      };

      const couriers = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          // Add courier-specific fields if you extend the User model
        },
      });

      // Get current workload for each courier
      const couriersWithWorkload = await Promise.all(
        couriers.map(async (courier) => {
          // Count active deliveries for this courier
          // Note: This assumes you have a way to track courier assignments
          const activeDeliveries = await this.prisma.parcel.count({
            where: {
              deletedAt: null,
              status: {
                in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
              },
              // Add courier assignment filtering here
            },
          });

          return {
            ...courier,
            currentLoad: activeDeliveries,
            vehicleType: 'Motorcycle', // Default, update based on your model
            maxCapacity: 10, // Default, update based on your model
          };
        }),
      );

      // Filter by max load if specified
      if (filters?.maxLoad !== undefined) {
        return couriersWithWorkload.filter(
          (courier) => courier.currentLoad <= Number(filters!.maxLoad),
        );
      }

      return couriersWithWorkload;
    } catch (error) {
      this.logger.error('Failed to get available couriers', error);
      throw new BadRequestException('Failed to retrieve available couriers');
    }
  }

  /**
   * Get courier by ID with detailed information
   */
  async getCourierById(courierId: string) {
    try {
      const courier = await this.prisma.user.findFirst({
        where: {
          id: courierId,
          role: Role.COURIER,
          deletedAt: null,
        },
      });

      if (!courier) {
        throw new BadRequestException('Courier not found');
      }

      // Get courier statistics
      const stats = await this.getCourierStatistics(courierId);

      return {
        ...courier,
        statistics: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get courier ${courierId}`, error);
      throw new BadRequestException('Failed to retrieve courier information');
    }
  }

  /**
   * Get courier statistics
   */
  async getCourierStatistics(courierId: string) {
    try {
      // Get delivery statistics for the courier
      // Note: This is a simplified version. You'll need to adjust based on your data model

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      // Count deliveries by status
      const [todayDeliveries, monthDeliveries, totalDeliveries] =
        await Promise.all([
          // Today's deliveries
          this.prisma.parcel.count({
            where: {
              status: 'DELIVERED',
              actualDelivery: {
                gte: today,
              },
              // Add courier filter
            },
          }),
          // This month's deliveries
          this.prisma.parcel.count({
            where: {
              status: 'DELIVERED',
              actualDelivery: {
                gte: thisMonth,
              },
              // Add courier filter
            },
          }),
          // Total deliveries
          this.prisma.parcel.count({
            where: {
              status: 'DELIVERED',
              // Add courier filter
            },
          }),
        ]);

      return {
        todayDeliveries,
        monthDeliveries,
        totalDeliveries,
        averageDeliveryTime: '45 minutes', // Calculate from actual data
        successRate: 98.5, // Calculate from actual data
        customerRating: 4.8, // If you have a rating system
      };
    } catch (error) {
      this.logger.error('Failed to get courier statistics', error);
      return {
        todayDeliveries: 0,
        monthDeliveries: 0,
        totalDeliveries: 0,
        averageDeliveryTime: 'N/A',
        successRate: 0,
        customerRating: 0,
      };
    }
  }

  /**
   * Update courier availability
   */
  async updateCourierAvailability(
    courierId: string,
    isAvailable: boolean,
    reason?: string,
  ) {
    try {
      const courier = await this.prisma.user.update({
        where: {
          id: courierId,
          role: Role.COURIER,
        },
        data: {
          isActive: isAvailable,
          updatedAt: new Date(),
        },
      });

      // Log availability change
      this.logger.log(
        `Courier ${courier.name} availability updated to ${isAvailable}`,
      );

      return courier;
    } catch (error) {
      this.logger.error('Failed to update courier availability', error);
      throw new BadRequestException('Failed to update courier availability');
    }
  }
}
