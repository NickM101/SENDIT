// src/modules/parcel/dto/parcel.dto.ts
import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsNotEmpty,
  Matches,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PackageType,
  DeliveryType,
  InsuranceCoverage,
  WeightUnit,
  DimensionUnit,
  KenyanCounty,
} from '@prisma/client';

// Address DTOs
export class AddressDto {
  @ApiProperty({ example: 'Kimathi Street, Times Tower' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'CBD' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ enum: KenyanCounty, example: KenyanCounty.NAIROBI })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '00100' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: 'Kenya', default: 'Kenya' })
  @IsString()
  country: string;

  @ApiProperty({ example: -1.2864 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 36.8172 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'Kimathi Street, Times Tower, CBD, Nairobi, Kenya' })
  @IsString()
  @IsNotEmpty()
  formattedAddress: string;
}

// Step 1: Sender Details DTO
export class SenderDetailsDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @Matches(/^\+254[17]\d{8}$/, {
    message: 'Phone must be a valid Kenyan number (+254...)',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'Tech Solutions Inc.' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @ApiPropertyOptional({ example: 'Please ring the bell twice' })
  @IsOptional()
  @IsString()
  pickupInstructions?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  useProfileAddress: boolean;
}

// Step 2: Recipient Details DTO
export class RecipientDetailsDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+254722123456' })
  @IsString()
  @Matches(/^\+254[17]\d{8}$/, {
    message: 'Phone must be a valid Kenyan number (+254...)',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'ABC Corporation' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;

  @ApiPropertyOptional({
    example: 'Leave with security guard if not available',
  })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  saveRecipient: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  sendNotifications: boolean;
}

// Dimensions DTO
export class DimensionsDto {
  @ApiProperty({ example: 30.5 })
  @IsNumber()
  @Min(0.1)
  @Max(200)
  length: number;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @Min(0.1)
  @Max(200)
  width: number;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  @Min(0.1)
  @Max(200)
  height: number;

  @ApiProperty({ enum: DimensionUnit, example: DimensionUnit.cm })
  @IsEnum(DimensionUnit)
  unit: DimensionUnit;
}

// Special Handling DTO
export class SpecialHandlingDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  fragile: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  perishable: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  hazardousMaterial: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  highValue: boolean;
}

// Step 3: Parcel Details DTO
export class ParcelDetailsDto {
  @ApiProperty({ enum: PackageType, example: PackageType.STANDARD_BOX })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({
    example: 'Electronics package containing laptop and accessories',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 50000, description: 'Estimated value in KES' })
  @IsNumber()
  @Min(1)
  @Max(500000)
  estimatedValue: number;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.1)
  @Max(50)
  weight: number;

  @ApiProperty({ enum: WeightUnit, example: WeightUnit.kg })
  @IsEnum(WeightUnit)
  weightUnit: WeightUnit;

  @ApiProperty({ type: DimensionsDto })
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @ApiProperty({ type: SpecialHandlingDto })
  @ValidateNested()
  @Type(() => SpecialHandlingDto)
  specialHandling: SpecialHandlingDto;

  @ApiProperty({
    enum: InsuranceCoverage,
    example: InsuranceCoverage.BASIC_COVERAGE,
  })
  @IsEnum(InsuranceCoverage)
  insuranceCoverage: InsuranceCoverage;

  @ApiPropertyOptional({ example: 'Please handle with extra care' })
  @IsOptional()
  @IsString()
  packagingInstructions?: string;
}

// Delivery Preferences DTO
export class DeliveryPreferencesDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  signatureRequired: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  smsNotifications: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  contactlessDelivery: boolean;
}

// Backup Delivery Options DTO
export class BackupDeliveryOptionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  retryDeliveryNextBusinessDay: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  leaveWithTrustedNeighbor: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  holdAtNearestPickupPoint: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  returnToSender: boolean;
}

// Step 4: Delivery Options DTO
export class DeliveryOptionsDto {
  @ApiProperty({ enum: DeliveryType, example: DeliveryType.STANDARD })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ example: '2025-07-25' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ example: '10:00-12:00' })
  @IsString()
  @IsNotEmpty()
  pickupTime: string;

  @ApiProperty({ example: '2025-07-29' })
  @IsDateString()
  estimatedDelivery: string;

  @ApiProperty({ type: DeliveryPreferencesDto })
  @ValidateNested()
  @Type(() => DeliveryPreferencesDto)
  deliveryPreferences: DeliveryPreferencesDto;

  @ApiProperty({ type: BackupDeliveryOptionsDto })
  @ValidateNested()
  @Type(() => BackupDeliveryOptionsDto)
  backupDeliveryOptions: BackupDeliveryOptionsDto;

  @ApiPropertyOptional({ example: 'Call 30 minutes before delivery' })
  @IsOptional()
  @IsString()
  specialDeliveryInstructions?: string;
}

// Payment Details DTO
export class PaymentDetailsDto {
  @ApiProperty({ example: 'CREDIT_CARD' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'pi_1234567890' })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @ApiProperty({ example: 2500.0 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'KES' })
  @IsString()
  currency: string;
}

// Complete Parcel Creation DTO
export class CreateParcelDto {
  @ApiProperty({ type: SenderDetailsDto })
  @ValidateNested()
  @Type(() => SenderDetailsDto)
  senderData: SenderDetailsDto;

  @ApiProperty({ type: RecipientDetailsDto })
  @ValidateNested()
  @Type(() => RecipientDetailsDto)
  recipientData: RecipientDetailsDto;

  @ApiProperty({ type: ParcelDetailsDto })
  @ValidateNested()
  @Type(() => ParcelDetailsDto)
  parcelData: ParcelDetailsDto;

  @ApiProperty({ type: DeliveryOptionsDto })
  @ValidateNested()
  @Type(() => DeliveryOptionsDto)
  deliveryData: DeliveryOptionsDto;

  @ApiProperty({ type: PaymentDetailsDto })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentData: PaymentDetailsDto;
}

// Parcel Draft DTO
export class ParcelDraftDto {
  @ApiProperty({ description: 'Step data as JSON object' })
  @IsObject()
  stepData: any;

  @ApiProperty({ example: 1, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  currentStep: number;
}

// Pricing Request DTO
export class PricingRequestDto {
  @ApiProperty({ type: SenderDetailsDto })
  @ValidateNested()
  @Type(() => SenderDetailsDto)
  senderData: SenderDetailsDto;

  @ApiProperty({ type: RecipientDetailsDto })
  @ValidateNested()
  @Type(() => RecipientDetailsDto)
  recipientData: RecipientDetailsDto;

  @ApiProperty({ type: ParcelDetailsDto })
  @ValidateNested()
  @Type(() => ParcelDetailsDto)
  parcelData: ParcelDetailsDto;

  @ApiProperty({ type: DeliveryOptionsDto })
  @ValidateNested()
  @Type(() => DeliveryOptionsDto)
  deliveryData: DeliveryOptionsDto;
}

// Quick Pricing DTO (for simplified calculations)
export class QuickPricingDto {
  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.1)
  @Max(50)
  weight: number;

  @ApiProperty({ enum: WeightUnit, example: WeightUnit.kg })
  @IsEnum(WeightUnit)
  weightUnit: WeightUnit;

  @ApiProperty({ enum: PackageType, example: PackageType.STANDARD_BOX })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.STANDARD })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;
}

// Update Parcel Status DTO
export class UpdateParcelStatusDto {
  @ApiProperty({ example: 'PICKED_UP' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 'Package collected from sender' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Nairobi, Kenya' })
  @IsOptional()
  @IsString()
  location?: string;
}

// Address Validation DTO
export class ValidateAddressDto {
  @ApiProperty({ example: 'Kimathi Street, Times Tower' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'CBD' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ enum: KenyanCounty, example: KenyanCounty.NAIROBI })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;
}

// Geocoding DTO
export class GeocodeAddressDto {
  @ApiProperty({ example: 'Kimathi Street, CBD, Nairobi, Kenya' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

// Reverse Geocoding DTO
export class ReverseGeocodeDto {
  @ApiProperty({ example: -1.2864 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 36.8172 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

// Query DTOs for filtering and pagination
export class ParcelQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'PROCESSING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'ST-20250725001' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2025-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Response DTOs
export class ParcelResponseDto {
  @ApiProperty({ example: 'cuid123' })
  id: string;

  @ApiProperty({ example: 'ST-20250725001' })
  trackingNumber: string;

  @ApiProperty({ example: 'PROCESSING' })
  status: string;

  @ApiProperty({ example: 2500.0 })
  totalPrice: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: '2025-07-25T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-07-29T16:00:00Z' })
  estimatedDelivery: Date;

  // Include other relevant fields as needed
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  lastPage: number;
}

export class PaginatedParcelResponseDto {
  @ApiProperty({ type: [ParcelResponseDto] })
  data: ParcelResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ParcelStatsDto {
  totalSent: number;
  totalReceived: number;
  pending: number; // Assuming this counts parcels with status like PROCESSING, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY
  delivered: number; // Assuming this counts parcels with status DELIVERED *today*
  monthlyGrowth: number; // Percentage growth for totalSent compared to last month
}