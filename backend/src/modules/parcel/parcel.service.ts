// src/modules/parcel/parcel.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { AddressService } from '../address/address.service';
import { PricingService, PricingInput } from '../pricing/pricing.service';
import {
  Parcel,
  ParcelStatus,
  User,
  PackageType,
  DeliveryType,
  InsuranceCoverage,
  WeightUnit,
  DimensionUnit,
  KenyanCounty,
  NotificationType,
  NotificationStatus,
  Role,
  Prisma,
} from '@prisma/client';

// DTOs for multi-step parcel creation
export interface SenderDetailsDto {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  pickupAddress: {
    street: string;
    area: string;
    city: string;
    county: KenyanCounty;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  pickupInstructions?: string;
  useProfileAddress: boolean;
}

export interface RecipientDetailsDto {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  deliveryAddress: {
    street: string;
    area: string;
    city: string;
    county: KenyanCounty;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  deliveryInstructions?: string;
  saveRecipient: boolean;
  sendNotifications: boolean;
}

export interface ParcelDetailsDto {
  packageType: PackageType;
  description: string;
  estimatedValue: number;
  weight: number;
  weightUnit: WeightUnit;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };
  specialHandling: {
    fragile: boolean;
    perishable: boolean;
    hazardousMaterial: boolean;
    highValue: boolean;
  };
  insuranceCoverage: InsuranceCoverage;
  packagingInstructions?: string;
}

export interface DeliveryOptionsDto {
  deliveryType: DeliveryType;
  pickupDate: string;
  pickupTime: string;
  estimatedDelivery: string;
  deliveryPreferences: {
    signatureRequired: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    contactlessDelivery: boolean;
  };
  backupDeliveryOptions: {
    retryDeliveryNextBusinessDay: boolean;
    leaveWithTrustedNeighbor: boolean;
    holdAtNearestPickupPoint: boolean;
    returnToSender: boolean;
  };
  specialDeliveryInstructions?: string;
}

export interface PaymentDetailsDto {
  paymentMethod: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
}

export interface CreateParcelDto {
  senderData: SenderDetailsDto;
  recipientData: RecipientDetailsDto;
  parcelData: ParcelDetailsDto;
  deliveryData: DeliveryOptionsDto;
  paymentData: PaymentDetailsDto;
}

export interface ParcelDraftDto {
  stepData: any;
  currentStep: number;
}

@Injectable()
export class ParcelService {
  private readonly logger = new Logger(ParcelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Save parcel draft (step-by-step data)
   */
  async saveParcelDraft(
    userId: string,
    draftData: ParcelDraftDto,
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.prisma.parcelDraft.upsert({
        where: {
          userId: userId,
        },
        update: {
          stepData: draftData.stepData,
          currentStep: draftData.currentStep,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          userId,
          stepData: draftData.stepData,
          currentStep: draftData.currentStep,
          expiresAt,
        },
      });

      this.logger.log(
        `Draft saved for user ${userId} at step ${draftData.currentStep}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save draft for user ${userId}`, error);
      throw new BadRequestException('Failed to save draft');
    }
  }

  /**
   * Get parcel draft for user
   */
  async getParcelDraft(userId: string) {
    try {
      const draft = await this.prisma.parcelDraft.findFirst({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return draft;
    } catch (error) {
      this.logger.error(`Failed to get draft for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Delete parcel draft
   */
  async deleteParcelDraft(userId: string): Promise<void> {
    try {
      await this.prisma.parcelDraft.deleteMany({
        where: { userId },
      });
      this.logger.log(`Draft deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete draft for user ${userId}`, error);
    }
  }

  /**
   * Calculate pricing for parcel data
   */
  async calculatePricing(
    senderData: SenderDetailsDto,
    recipientData: RecipientDetailsDto,
    parcelData: ParcelDetailsDto,
    deliveryData: DeliveryOptionsDto,
  ) {
    try {
      const pricingInput: PricingInput = {
        packageType: parcelData.packageType,
        weight: parcelData.weight,
        weightUnit: parcelData.weightUnit,
        dimensions: parcelData.dimensions,
        estimatedValue: parcelData.estimatedValue,
        deliveryType: deliveryData.deliveryType,
        fragile: parcelData.specialHandling.fragile,
        perishable: parcelData.specialHandling.perishable,
        hazardousMaterial: parcelData.specialHandling.hazardousMaterial,
        highValue: parcelData.specialHandling.highValue,
        insuranceCoverage: parcelData.insuranceCoverage,
        signatureRequired: deliveryData.deliveryPreferences.signatureRequired,
        senderLatitude: senderData.pickupAddress.latitude,
        senderLongitude: senderData.pickupAddress.longitude,
        recipientLatitude: recipientData.deliveryAddress.latitude,
        recipientLongitude: recipientData.deliveryAddress.longitude,
      };

      return await this.pricingService.calculatePricing(pricingInput);
    } catch (error) {
      this.logger.error('Failed to calculate pricing', error);
      throw new BadRequestException('Failed to calculate pricing');
    }
  }

  /**
   * Create complete parcel from multi-step data
   */
  async createParcel(
    userId: string,
    createParcelDto: CreateParcelDto,
  ): Promise<Parcel> {
    const { senderData, recipientData, parcelData, deliveryData, paymentData } =
      createParcelDto;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Create or get sender address
        const senderAddress =
          await this.addressService.validateAndCreateAddress(
            {
              name: senderData.fullName,
              email: senderData.email,
              phone: senderData.phone,
              street: senderData.pickupAddress.street,
              area: senderData.pickupAddress.area,
              city: senderData.pickupAddress.city,
              county: senderData.pickupAddress.county,
              state: senderData.pickupAddress.state,
              zipCode: senderData.pickupAddress.zipCode,
              country: senderData.pickupAddress.country,
              latitude: senderData.pickupAddress.latitude,
              longitude: senderData.pickupAddress.longitude,
            },
            userId,
          );

        // 2. Create or get recipient address
        const recipientAddress =
          await this.addressService.validateAndCreateAddress(
            {
              name: recipientData.fullName,
              email: recipientData.email,
              phone: recipientData.phone,
              street: recipientData.deliveryAddress.street,
              area: recipientData.deliveryAddress.area,
              city: recipientData.deliveryAddress.city,
              county: recipientData.deliveryAddress.county,
              state: recipientData.deliveryAddress.state,
              zipCode: recipientData.deliveryAddress.zipCode,
              country: recipientData.deliveryAddress.country,
              latitude: recipientData.deliveryAddress.latitude,
              longitude: recipientData.deliveryAddress.longitude,
            },
            userId,
          );

        // 3. Create dimensions
        const dimensions = await prisma.dimensions.create({
          data: {
            length: parcelData.dimensions.length,
            width: parcelData.dimensions.width,
            height: parcelData.dimensions.height,
            unit: parcelData.dimensions.unit,
            volumetricWeight: this.calculateVolumetricWeight(
              parcelData.dimensions,
            ),
            createdBy: userId,
          },
        });

        // 4. Calculate final pricing
        const pricing = await this.calculatePricing(
          senderData,
          recipientData,
          parcelData,
          deliveryData,
        );

        // 5. Generate tracking number
        const trackingNumber = await this.generateTrackingNumber();

        // 6. Find or create recipient user (optional)
        let recipientUser: User | null = null;
        try {
          recipientUser = await prisma.user.findUnique({
            where: { email: recipientData.email },
          });
        } catch {
          // Recipient not a registered user, continue without recipientId
        }

        // 7. Create parcel
        const parcel = await prisma.parcel.create({
          data: {
            trackingNumber,
            senderId: userId,
            recipientId: recipientUser?.id,

            // Pricing
            basePrice: pricing.baseRate,
            weightSurcharge: pricing.weightSurcharge,
            serviceSurcharge: pricing.serviceSurcharge,
            specialHandlingSurcharge: pricing.specialHandlingSurcharge,
            insuranceCost: pricing.insuranceCost,
            deliverySpeedSurcharge: pricing.deliverySpeedSurcharge,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            totalPrice: pricing.total,
            currency: pricing.currency,

            // Package details
            weight: parcelData.weight,
            weightUnit: parcelData.weightUnit,
            estimatedValue: parcelData.estimatedValue,
            description: parcelData.description,
            packageType: parcelData.packageType,

            // Addresses
            dimensionsId: dimensions.id,
            senderAddressId: senderAddress.id,
            recipientAddressId: recipientAddress.id,

            // Delivery
            deliveryType: deliveryData.deliveryType,
            pickupDate: new Date(deliveryData.pickupDate),
            pickupTimeSlot: deliveryData.pickupTime,
            estimatedDelivery: new Date(deliveryData.estimatedDelivery),

            // Special handling
            fragile: parcelData.specialHandling.fragile,
            perishable: parcelData.specialHandling.perishable,
            hazardousMaterial: parcelData.specialHandling.hazardousMaterial,
            highValue: parcelData.specialHandling.highValue,

            // Instructions
            pickupInstructions: senderData.pickupInstructions,
            deliveryInstructions: recipientData.deliveryInstructions,
            packagingInstructions: parcelData.packagingInstructions,
            specialHandling: deliveryData.specialDeliveryInstructions,

            // Insurance and preferences
            insuranceCoverage: parcelData.insuranceCoverage,
            signatureRequired:
              deliveryData.deliveryPreferences.signatureRequired,
            emailNotifications:
              deliveryData.deliveryPreferences.emailNotifications,
            smsNotifications: deliveryData.deliveryPreferences.smsNotifications,
            contactlessDelivery:
              deliveryData.deliveryPreferences.contactlessDelivery,

            // Backup delivery options
            retryNextBusinessDay:
              deliveryData.backupDeliveryOptions.retryDeliveryNextBusinessDay,
            leaveWithNeighbor:
              deliveryData.backupDeliveryOptions.leaveWithTrustedNeighbor,
            holdAtPickupPoint:
              deliveryData.backupDeliveryOptions.holdAtNearestPickupPoint,
            returnToSender: deliveryData.backupDeliveryOptions.returnToSender,

            // Status
            status: ParcelStatus.PAYMENT_PENDING,
            createdBy: userId,
          },
          include: {
            sender: true,
            recipient: true,
            senderAddress: true,
            recipientAddress: true,
            dimensions: true,
          },
        });

        // 8. Save recipient if requested
        if (recipientData.saveRecipient) {
          await this.saveRecipient(userId, recipientData, recipientAddress.id);
        }

        // 9. Create initial tracking history
        await prisma.trackingHistory.create({
          data: {
            parcelId: parcel.id,
            status: ParcelStatus.PAYMENT_PENDING,
            description: 'Parcel created, awaiting payment confirmation',
            updatedBy: userId,
          },
        });

        // 10. Save pricing history
        await this.pricingService.savePricingHistory(
          parcel.id,
          'final_calculation',
          pricing,
        );

        // 11. Delete draft if exists
        await this.deleteParcelDraft(userId);

        this.logger.log(`Parcel created successfully: ${trackingNumber}`);
        return parcel;
      });
    } catch (error) {
      this.logger.error('Failed to create parcel', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create parcel');
    }
  }

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
   * Get parcels by user (sent parcels)
   */
  async getParcelsByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: ParcelStatus,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        senderId: userId,
        deletedAt: null,
        ...(status && { status }),
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

      return parcels;
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

  /**
   * Update parcel status
   */
  async updateParcelStatus(
    parcelId: string,
    status: ParcelStatus,
    description?: string,
    location?: string,
    updatedBy?: string,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
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
            updatedBy,
          },
        });
      });

      this.logger.log(`Parcel ${parcelId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update parcel status for ${parcelId}`,
        error,
      );
      throw new BadRequestException('Failed to update parcel status');
    }
  }

  /**
   * Get saved recipients for user
   */
  async getSavedRecipients(userId: string) {
    try {
      return await this.prisma.savedRecipient.findMany({
        where: { userId },
        include: {
          address: true,
        },
        orderBy: { lastUsed: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get saved recipients for user ${userId}`,
        error,
      );
      throw new BadRequestException('Failed to retrieve saved recipients');
    }
  }

  // Private helper methods
  private async generateTrackingNumber(): Promise<string> {
    let trackingNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      if (attempts >= maxAttempts) {
        throw new ConflictException(
          'Unable to generate unique tracking number',
        );
      }

      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
      trackingNumber = `ST-${timestamp}${random}`;

      const existing = await this.prisma.parcel.findUnique({
        where: { trackingNumber },
      });

      if (!existing) {
        break;
      }

      attempts++;
    } while (true);

    return trackingNumber;
  }

  private calculateVolumetricWeight(
    dimensions: ParcelDetailsDto['dimensions'],
  ): number {
    const { length, width, height, unit } = dimensions;

    // Convert to centimeters
    let lengthCm = length;
    let widthCm = width;
    let heightCm = height;

    if (unit === DimensionUnit.in) {
      lengthCm *= 2.54;
      widthCm *= 2.54;
      heightCm *= 2.54;
    } else if (unit === DimensionUnit.m) {
      lengthCm *= 100;
      widthCm *= 100;
      heightCm *= 100;
    } else if (unit === DimensionUnit.ft) {
      lengthCm *= 30.48;
      widthCm *= 30.48;
      heightCm *= 30.48;
    }

    const volumeCm3 = lengthCm * widthCm * heightCm;
    return volumeCm3 / 5000; // Standard volumetric divisor
  }

  private async saveRecipient(
    userId: string,
    recipientData: RecipientDetailsDto,
    addressId: string,
  ): Promise<void> {
    try {
      await this.prisma.savedRecipient.upsert({
        where: {
          userId_email_phone: {
            userId,
            email: recipientData.email,
            phone: recipientData.phone,
          },
        },
        update: {
          name: recipientData.fullName,
          company: recipientData.company,
          addressId,
          lastUsed: new Date(),
        },
        create: {
          userId,
          name: recipientData.fullName,
          email: recipientData.email,
          phone: recipientData.phone,
          company: recipientData.company,
          addressId,
        },
      });

      this.logger.log(`Recipient saved for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to save recipient for user ${userId}`, error);
      // Don't throw error here, as it's not critical to parcel creation
    }
  }

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
              ? `${parcel.pickupInstructions || ''}\n\nAdmin Note: ${instructions}`.trim()
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
        // await prisma.courierAssignment.create({
        //   data: {
        //     parcelId,
        //     courierId,
        //     assignedBy: adminId,
        //     assignedAt: new Date(),
        //     status: 'ACTIVE'
        //   }
        // });

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
      };

      // If specific courier ID provided, filter by that courier
      // Note: You'll need to add a courierId field to the Parcel model
      // or create a CourierAssignment table to track assignments

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

  /**
   * Get delivery points
   */
  async getDeliveryPoints(filters?: {
    county?: KenyanCounty;
    city?: string;
    isActive?: boolean;
  }) {
    try {
      const where: Prisma.PickupPointWhereInput = {
        isActive: filters?.isActive ?? true,
      };

      if (filters?.county) {
        where.county = filters.county;
      }

      if (filters?.city) {
        where.city = {
          contains: filters.city,
          mode: 'insensitive',
        };
      }

      const deliveryPoints = await this.prisma.pickupPoint.findMany({
        where,
        orderBy: [{ county: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      });

      return deliveryPoints;
    } catch (error) {
      this.logger.error('Failed to get delivery points', error);
      throw new BadRequestException('Failed to retrieve delivery points');
    }
  }

  /**
   * Update parcel status with validation
   */
  // async updateParcelStatus(
  //   parcelId: string,
  //   status: ParcelStatus,
  //   description?: string,
  //   location?: string,
  //   updatedBy?: string,
  //   coordinates?: { latitude: number; longitude: number },
  // ): Promise<void> {
  //   try {
  //     await this.prisma.$transaction(async (prisma) => {
  //       // Validate status transition
  //       const parcel = await prisma.parcel.findUnique({
  //         where: { id: parcelId },
  //         select: { status: true, recipientId: true },
  //       });

  //       if (!parcel) {
  //         throw new NotFoundException('Parcel not found');
  //       }

  //       // Define valid status transitions
  //       const validTransitions: { [key in ParcelStatus]?: ParcelStatus[] } = {
  //         [ParcelStatus.PROCESSING]: [
  //           ParcelStatus.PAYMENT_PENDING,
  //           ParcelStatus.PAYMENT_CONFIRMED,
  //         ],
  //         [ParcelStatus.PAYMENT_PENDING]: [
  //           ParcelStatus.PAYMENT_CONFIRMED,
  //           ParcelStatus.CANCELLED,
  //         ],
  //         [ParcelStatus.PAYMENT_CONFIRMED]: [
  //           ParcelStatus.PICKED_UP,
  //           ParcelStatus.CANCELLED,
  //         ],
  //         [ParcelStatus.PICKED_UP]: [
  //           ParcelStatus.IN_TRANSIT,
  //           ParcelStatus.DELAYED,
  //         ],
  //         [ParcelStatus.IN_TRANSIT]: [
  //           ParcelStatus.OUT_FOR_DELIVERY,
  //           ParcelStatus.DELAYED,
  //         ],
  //         [ParcelStatus.OUT_FOR_DELIVERY]: [
  //           ParcelStatus.DELIVERED,
  //           ParcelStatus.DELAYED,
  //           ParcelStatus.RETURNED,
  //         ],
  //         [ParcelStatus.DELAYED]: [
  //           ParcelStatus.IN_TRANSIT,
  //           ParcelStatus.OUT_FOR_DELIVERY,
  //           ParcelStatus.RETURNED,
  //         ],
  //         [ParcelStatus.DELIVERED]: [], // Final status
  //         [ParcelStatus.RETURNED]: [ParcelStatus.REFUNDED],
  //         [ParcelStatus.CANCELLED]: [ParcelStatus.REFUNDED],
  //       };

  //       const allowedTransitions = validTransitions[parcel.status] || [];
  //       if (!allowedTransitions.includes(status)) {
  //         throw new BadRequestException(
  //           `Invalid status transition from ${parcel.status} to ${status}`,
  //         );
  //       }

  //       // Update parcel status
  //       await prisma.parcel.update({
  //         where: { id: parcelId },
  //         data: {
  //           status,
  //           updatedBy,
  //           ...(status === ParcelStatus.DELIVERED && {
  //             actualDelivery: new Date(),
  //           }),
  //         },
  //       });

  //       // Create tracking history entry
  //       await prisma.trackingHistory.create({
  //         data: {
  //           parcelId,
  //           status,
  //           description: description || `Status updated to ${status}`,
  //           location,
  //           latitude: coordinates?.latitude,
  //           longitude: coordinates?.longitude,
  //           updatedBy,
  //         },
  //       });

  //       // Send notifications based on status
  //       if (status === ParcelStatus.OUT_FOR_DELIVERY && parcel.recipientId) {
  //         await prisma.notification.create({
  //           data: {
  //             userId: parcel.recipientId,
  //             parcelId,
  //             type: NotificationType.EMAIL,
  //             status: NotificationStatus.PENDING,
  //             subject: 'Your parcel is out for delivery',
  //             message:
  //               'Your parcel will be delivered today. Please ensure someone is available to receive it.',
  //             queuedAt: new Date(),
  //           },
  //         });
  //       }

  //       if (status === ParcelStatus.DELIVERED && parcel.recipientId) {
  //         await prisma.notification.create({
  //           data: {
  //             userId: parcel.recipientId,
  //             parcelId,
  //             type: NotificationType.EMAIL,
  //             status: NotificationStatus.PENDING,
  //             subject: 'Your parcel has been delivered',
  //             message:
  //               'Your parcel has been successfully delivered. Thank you for using SendIT!',
  //             queuedAt: new Date(),
  //           },
  //         });
  //       }
  //     });

  //     this.logger.log(`Parcel ${parcelId} status updated to ${status}`);
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to update parcel status for ${parcelId}`,
  //       error,
  //     );
  //     if (
  //       error instanceof BadRequestException ||
  //       error instanceof NotFoundException
  //     ) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Failed to update parcel status');
  //   }
  // }
}
