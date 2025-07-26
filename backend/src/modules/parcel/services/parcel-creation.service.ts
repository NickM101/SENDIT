// src/modules/parcel/services/parcel-creation.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { AddressService } from '../../address/address.service';
import { PricingService, PricingInput } from '../../pricing/pricing.service';
import {
  Parcel,
  ParcelStatus,
  User,
  DimensionUnit,
} from '@prisma/client';
import { ParcelDraftDto, SenderDetailsDto, RecipientDetailsDto, ParcelDetailsDto, DeliveryOptionsDto, CreateParcelDto } from '../dto/parcel.dto';

@Injectable()
export class ParcelCreationService {
  private readonly logger = new Logger(ParcelCreationService.name);

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
   * Calculates volumetric weight based on dimensions.
   * @param dimensions The parcel dimensions.
   * @returns The calculated volumetric weight.
   */
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

  /**
   * Generates a unique tracking number.
   * @returns A unique tracking number string.
   */
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

  /**
   * Create complete parcel from multi-step data.
   * This is the main orchestrator for the complex creation process.
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
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create parcel');
    }
  }

  /**
   * Private helper to save recipient (moved from main service)
   */
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
}
