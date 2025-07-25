// src/modules/pricing/pricing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import {
  PackageType,
  DeliveryType,
  InsuranceCoverage,
  WeightUnit,
  DimensionUnit,
} from '@prisma/client';

export interface PricingInput {
  // Package details
  packageType: PackageType;
  weight: number;
  weightUnit: WeightUnit;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };
  estimatedValue: number;

  // Delivery details
  deliveryType: DeliveryType;
  distance?: number; // in kilometers

  // Special handling
  fragile: boolean;
  perishable: boolean;
  hazardousMaterial: boolean;
  highValue: boolean;

  // Insurance
  insuranceCoverage: InsuranceCoverage;

  // Delivery preferences
  signatureRequired: boolean;

  // Location data (for distance-based pricing)
  senderLatitude?: number;
  senderLongitude?: number;
  recipientLatitude?: number;
  recipientLongitude?: number;
}

export interface PricingBreakdown {
  // Base pricing
  baseRate: number;

  // Surcharges
  weightSurcharge: number;
  distanceSurcharge: number;
  serviceSurcharge: number; // Package type surcharge
  specialHandlingSurcharge: number;
  deliverySpeedSurcharge: number;

  // Additional services
  insuranceCost: number;
  signatureCost: number;

  // Calculations
  subtotal: number;
  tax: number; // 8% VAT for Kenya
  total: number;

  // Metadata
  currency: string;
  estimatedDeliveryDays: string;
  volumetricWeight: number;
  billableWeight: number; // Higher of actual or volumetric weight
}

export interface PricingConfig {
  baseRate: number;
  taxRate: number;
  currency: string;

  // Weight-based pricing (per kg)
  weightTiers: {
    tier: string;
    maxWeight: number;
    surcharge: number;
  }[];

  // Distance-based pricing (per km)
  distanceTiers: {
    tier: string;
    maxDistance: number;
    surcharge: number;
  }[];

  // Package type surcharges
  packageTypeSurcharges: {
    [key in PackageType]: number;
  };

  // Delivery speed multipliers
  deliverySpeedMultipliers: {
    [key in DeliveryType]: {
      multiplier: number;
      estimatedDays: string;
    };
  };

  // Insurance rates
  insuranceRates: {
    [key in InsuranceCoverage]: {
      fixedCost: number;
      percentageRate: number;
      maxCoverage: number;
    };
  };

  // Special handling fees
  specialHandlingFees: {
    fragile: number;
    perishable: number;
    hazardousMaterial: number;
    highValue: number;
    signatureRequired: number;
  };

  // Volumetric weight divisor (cm³/divisor = kg)
  volumetricDivisor: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  // Pricing configuration for SendIT Kenya
  private readonly config: PricingConfig = {
    baseRate: 150.0, // KES 150 base rate
    taxRate: 0.16, // 16% VAT for Kenya
    currency: 'KES',

    weightTiers: [
      { tier: 'Light', maxWeight: 1, surcharge: 0 },
      { tier: 'Standard', maxWeight: 5, surcharge: 100 },
      { tier: 'Heavy', maxWeight: 20, surcharge: 300 },
      { tier: 'Extra Heavy', maxWeight: 50, surcharge: 600 },
    ],

    distanceTiers: [
      { tier: 'Local', maxDistance: 10, surcharge: 0 },
      { tier: 'City', maxDistance: 50, surcharge: 50 },
      { tier: 'Regional', maxDistance: 200, surcharge: 150 },
      { tier: 'National', maxDistance: 1000, surcharge: 300 },
    ],

    packageTypeSurcharges: {
      [PackageType.STANDARD_BOX]: 0,
      [PackageType.DOCUMENT]: -50, // Discount for documents
      [PackageType.CLOTHING]: 0,
      [PackageType.ELECTRONICS]: 100, // Extra handling for electronics
      [PackageType.FRAGILE]: 150, // Extra handling for fragile items
      [PackageType.LIQUID]: 200, // Special handling for liquids
      [PackageType.PERISHABLE]: 250, // Refrigeration and speed requirements
    },

    deliverySpeedMultipliers: {
      [DeliveryType.STANDARD]: {
        multiplier: 1.0,
        estimatedDays: '3-5 business days',
      },
      [DeliveryType.EXPRESS]: {
        multiplier: 1.5,
        estimatedDays: '1-2 business days',
      },
      [DeliveryType.SAME_DAY]: {
        multiplier: 2.5,
        estimatedDays: 'Same day (4-6 hours)',
      },
      [DeliveryType.OVERNIGHT]: {
        multiplier: 2.0,
        estimatedDays: 'Next business day',
      },
    },

    insuranceRates: {
      [InsuranceCoverage.NO_INSURANCE]: {
        fixedCost: 0,
        percentageRate: 0,
        maxCoverage: 0,
      },
      [InsuranceCoverage.BASIC_COVERAGE]: {
        fixedCost: 50,
        percentageRate: 0.005, // 0.5% of value
        maxCoverage: 10000, // KES 10,000
      },
      [InsuranceCoverage.PREMIUM_COVERAGE]: {
        fixedCost: 150,
        percentageRate: 0.01, // 1% of value
        maxCoverage: 50000, // KES 50,000
      },
      [InsuranceCoverage.CUSTOM_COVERAGE]: {
        fixedCost: 100,
        percentageRate: 0.015, // 1.5% of value
        maxCoverage: 500000, // KES 500,000
      },
    },

    specialHandlingFees: {
      fragile: 75,
      perishable: 150,
      hazardousMaterial: 300,
      highValue: 200,
      signatureRequired: 25,
    },

    volumetricDivisor: 5000, // Standard volumetric divisor
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate pricing for a parcel
   */
  async calculatePricing(input: PricingInput): Promise<PricingBreakdown> {
    this.logger.log(
      `Calculating pricing for package type: ${input.packageType}`,
    );

    try {
      // Calculate volumetric weight
      const volumetricWeight = this.calculateVolumetricWeight(input.dimensions);

      // Determine billable weight (higher of actual or volumetric)
      const actualWeightInKg = this.convertToKilograms(
        input.weight,
        input.weightUnit,
      );
      const billableWeight = Math.max(actualWeightInKg, volumetricWeight);

      // Calculate distance if coordinates provided
      let distance = input.distance || 0;
      if (!distance && this.hasCoordinates(input)) {
        distance = this.calculateDistance(
          input.senderLatitude!,
          input.senderLongitude!,
          input.recipientLatitude!,
          input.recipientLongitude!,
        );
      }

      // Base calculations
      const baseRate = this.config.baseRate;
      const weightSurcharge = this.calculateWeightSurcharge(billableWeight);
      const distanceSurcharge = this.calculateDistanceSurcharge(distance);
      const serviceSurcharge =
        this.config.packageTypeSurcharges[input.packageType];
      const specialHandlingSurcharge =
        this.calculateSpecialHandlingSurcharge(input);
      const insuranceCost = this.calculateInsuranceCost(
        input.insuranceCoverage,
        input.estimatedValue,
      );
      const signatureCost = input.signatureRequired
        ? this.config.specialHandlingFees.signatureRequired
        : 0;

      // Calculate subtotal before delivery speed multiplier
      const preSpeedSubtotal =
        baseRate +
        weightSurcharge +
        distanceSurcharge +
        serviceSurcharge +
        specialHandlingSurcharge +
        insuranceCost +
        signatureCost;

      // Apply delivery speed multiplier
      const speedMultiplier =
        this.config.deliverySpeedMultipliers[input.deliveryType].multiplier;
      const deliverySpeedSurcharge =
        preSpeedSubtotal * speedMultiplier - preSpeedSubtotal;

      // Final calculations
      const subtotal = preSpeedSubtotal + deliverySpeedSurcharge;
      const tax = subtotal * this.config.taxRate;
      const total = subtotal + tax;

      const breakdown: PricingBreakdown = {
        baseRate,
        weightSurcharge,
        distanceSurcharge,
        serviceSurcharge,
        specialHandlingSurcharge,
        deliverySpeedSurcharge,
        insuranceCost,
        signatureCost,
        subtotal,
        tax,
        total,
        currency: this.config.currency,
        estimatedDeliveryDays:
          this.config.deliverySpeedMultipliers[input.deliveryType]
            .estimatedDays,
        volumetricWeight,
        billableWeight,
      };

      this.logger.log(
        `Pricing calculated: Total ${total} ${this.config.currency}`,
      );
      return breakdown;
    } catch (error) {
      this.logger.error('Failed to calculate pricing', error);
      throw error;
    }
  }

  /**
   * Save pricing history for a parcel
   */
  async savePricingHistory(
    parcelId: string,
    step: string,
    pricing: PricingBreakdown,
  ): Promise<void> {
    try {
      await this.prisma.pricingHistory.create({
        data: {
          parcelId,
          step,
          pricing: pricing as any, // Prisma Json type
        },
      });

      this.logger.log(
        `Pricing history saved for parcel ${parcelId} at step ${step}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save pricing history for parcel ${parcelId}`,
        error,
      );
    }
  }

  /**
   * Get pricing configuration (for frontend)
   */
  getPricingConfig() {
    return {
      baseRate: this.config.baseRate,
      currency: this.config.currency,
      taxRate: this.config.taxRate,
      weightTiers: this.config.weightTiers,
      distanceTiers: this.config.distanceTiers,
      packageTypes: Object.keys(this.config.packageTypeSurcharges).map(
        (key) => ({
          type: key,
          surcharge: this.config.packageTypeSurcharges[key as PackageType],
        }),
      ),
      deliveryOptions: Object.entries(this.config.deliverySpeedMultipliers).map(
        ([key, value]) => ({
          type: key,
          multiplier: value.multiplier,
          estimatedDays: value.estimatedDays,
        }),
      ),
      insuranceOptions: Object.entries(this.config.insuranceRates).map(
        ([key, value]) => ({
          coverage: key,
          fixedCost: value.fixedCost,
          percentageRate: value.percentageRate,
          maxCoverage: value.maxCoverage,
        }),
      ),
    };
  }

  /**
   * Calculate quick estimate (simplified calculation for frontend)
   */
  calculateQuickEstimate(
    weight: number,
    weightUnit: WeightUnit,
    packageType: PackageType,
    deliveryType: DeliveryType,
  ): number {
    const actualWeightInKg = this.convertToKilograms(weight, weightUnit);
    const baseRate = this.config.baseRate;
    const weightSurcharge = this.calculateWeightSurcharge(actualWeightInKg);
    const serviceSurcharge = this.config.packageTypeSurcharges[packageType];
    const speedMultiplier =
      this.config.deliverySpeedMultipliers[deliveryType].multiplier;

    const subtotal =
      (baseRate + weightSurcharge + serviceSurcharge) * speedMultiplier;
    const tax = subtotal * this.config.taxRate;

    return Math.round((subtotal + tax) * 100) / 100;
  }

  // Private calculation methods
  private calculateVolumetricWeight(
    dimensions: PricingInput['dimensions'],
  ): number {
    const { length, width, height, unit } = dimensions;

    // Convert dimensions to centimeters
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
    return volumeCm3 / this.config.volumetricDivisor;
  }

  private convertToKilograms(weight: number, unit: WeightUnit): number {
    switch (unit) {
      case WeightUnit.kg:
        return weight;
      case WeightUnit.g:
        return weight / 1000;
      case WeightUnit.lb:
        return weight * 0.453592;
      case WeightUnit.oz:
        return weight * 0.0283495;
      default:
        return weight; // Default to kg
    }
  }

  private calculateWeightSurcharge(weightKg: number): number {
    for (const tier of this.config.weightTiers) {
      if (weightKg <= tier.maxWeight) {
        return tier.surcharge;
      }
    }
    // If weight exceeds all tiers, use the highest tier surcharge
    return this.config.weightTiers[this.config.weightTiers.length - 1]
      .surcharge;
  }

  private calculateDistanceSurcharge(distanceKm: number): number {
    for (const tier of this.config.distanceTiers) {
      if (distanceKm <= tier.maxDistance) {
        return tier.surcharge;
      }
    }
    // If distance exceeds all tiers, use the highest tier surcharge
    return this.config.distanceTiers[this.config.distanceTiers.length - 1]
      .surcharge;
  }

  private calculateSpecialHandlingSurcharge(input: PricingInput): number {
    let total = 0;

    if (input.fragile) {
      total += this.config.specialHandlingFees.fragile;
    }
    if (input.perishable) {
      total += this.config.specialHandlingFees.perishable;
    }
    if (input.hazardousMaterial) {
      total += this.config.specialHandlingFees.hazardousMaterial;
    }
    if (input.highValue) {
      total += this.config.specialHandlingFees.highValue;
    }

    return total;
  }

  private calculateInsuranceCost(
    coverage: InsuranceCoverage,
    estimatedValue: number,
  ): number {
    const insuranceConfig = this.config.insuranceRates[coverage];

    if (coverage === InsuranceCoverage.NO_INSURANCE) {
      return 0;
    }

    const percentageCost = Math.min(
      estimatedValue * insuranceConfig.percentageRate,
      insuranceConfig.maxCoverage * insuranceConfig.percentageRate,
    );

    return insuranceConfig.fixedCost + percentageCost;
  }

  private hasCoordinates(input: PricingInput): boolean {
    return !!(
      input.senderLatitude &&
      input.senderLongitude &&
      input.recipientLatitude &&
      input.recipientLongitude
    );
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
