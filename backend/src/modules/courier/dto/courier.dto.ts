// src/modules/courier/dto/courier.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Enums matching Prisma schema
export enum ParcelStatusEnum {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PackageTypeEnum {
  STANDARD_BOX = 'STANDARD_BOX',
  DOCUMENT = 'DOCUMENT',
  CLOTHING = 'CLOTHING',
  ELECTRONICS = 'ELECTRONICS',
  FRAGILE = 'FRAGILE',
  LIQUID = 'LIQUID',
  PERISHABLE = 'PERISHABLE',
}

export enum DeliveryTypeEnum {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
  OVERNIGHT = 'OVERNIGHT',
}

export enum PriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum DeliveryFilterTypeEnum {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

// User information DTOs
export class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User phone number' })
  phone: string;
}

// Address DTOs
export class AddressDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'Address name/label' })
  name: string;

  @ApiPropertyOptional({ description: 'Contact email for this address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone for this address' })
  phone?: string;

  @ApiProperty({ description: 'Street address' })
  street: string;

  @ApiProperty({ description: 'Area/neighborhood' })
  area: string;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'County' })
  county: string;

  @ApiProperty({ description: 'State/region' })
  state: string;

  @ApiProperty({ description: 'Zip/postal code' })
  zipCode: string;

  @ApiProperty({ description: 'Country', default: 'Kenya' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  longitude?: number;
}

// Courier Assignment DTO
export class CourierAssignmentDto {
  @ApiProperty({ description: 'Assignment ID' })
  id: string;

  @ApiProperty({ description: 'Date and time when parcel was assigned' })
  assignedAt: Date;

  @ApiProperty({
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    description: 'Assignment status',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Date and time when assignment was completed',
  })
  completedAt?: Date;
}

// Tracking History DTO
export class TrackingHistoryDto {
  @ApiProperty({ description: 'Tracking history entry ID' })
  id: string;

  @ApiProperty({
    enum: ParcelStatusEnum,
    description: 'Parcel status at this point in time',
  })
  status: string;

  @ApiPropertyOptional({ description: 'Location description' })
  location?: string;

  @ApiPropertyOptional({ description: 'Status description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  longitude?: number;

  @ApiProperty({ description: 'Timestamp of status update' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'ID of user who updated the status' })
  updatedBy?: string;
}

// Delivery Attempt DTO
export class DeliveryAttemptDto {
  @ApiProperty({ description: 'Delivery attempt ID' })
  id: string;

  @ApiProperty({ description: 'Date and time of delivery attempt' })
  attemptDate: Date;

  @ApiProperty({
    enum: [
      'SUCCESSFUL',
      'FAILED_NO_ONE_HOME',
      'FAILED_INCORRECT_ADDRESS',
      'FAILED_REFUSED',
      'FAILED_WEATHER',
      'FAILED_OTHER',
    ],
    description: 'Attempt status',
  })
  status: string;

  @ApiPropertyOptional({ description: 'Reason for failure (if applicable)' })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Date and time of next attempt (if scheduled)',
  })
  nextAttempt?: Date;

  @ApiPropertyOptional({ description: 'Courier notes about the attempt' })
  courierNotes?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate of attempt' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate of attempt' })
  longitude?: number;
}

// Main Courier Delivery DTO
export class CourierDelivery {
  @ApiProperty({ description: 'Parcel ID' })
  id: string;

  @ApiProperty({ description: 'Unique tracking number' })
  trackingNumber: string;

  @ApiProperty({
    enum: ParcelStatusEnum,
    description: 'Current parcel status',
  })
  status: ParcelStatusEnum;

  @ApiProperty({
    enum: PackageTypeEnum,
    description: 'Type of package',
  })
  packageType: PackageTypeEnum;

  @ApiProperty({
    enum: DeliveryTypeEnum,
    description: 'Delivery service type',
  })
  deliveryType: DeliveryTypeEnum;

  @ApiProperty({ description: 'Package weight' })
  weight: number;

  @ApiProperty({
    enum: ['kg', 'lb', 'g', 'oz'],
    description: 'Weight unit',
  })
  weightUnit: string;

  @ApiProperty({ description: 'Estimated value of package contents' })
  estimatedValue: number;

  @ApiProperty({ description: 'Package description' })
  description: string;

  @ApiProperty({ description: 'Total price for delivery' })
  totalPrice: number;

  @ApiProperty({ description: 'Currency code', default: 'KES' })
  currency: string;

  @ApiProperty({ type: UserInfoDto, description: 'Sender information' })
  sender: UserInfoDto;

  @ApiProperty({ type: UserInfoDto, description: 'Recipient information' })
  recipient: UserInfoDto;

  @ApiProperty({ type: AddressDto, description: 'Pickup address' })
  senderAddress: AddressDto;

  @ApiProperty({ type: AddressDto, description: 'Delivery address' })
  recipientAddress: AddressDto;

  @ApiPropertyOptional({ description: 'Scheduled pickup date' })
  pickupDate?: Date;

  @ApiPropertyOptional({ description: 'Pickup time slot' })
  pickupTimeSlot?: string;

  @ApiPropertyOptional({ description: 'Scheduled delivery date' })
  deliveryDate?: Date;

  @ApiPropertyOptional({ description: 'Estimated delivery date and time' })
  estimatedDelivery?: Date;

  @ApiPropertyOptional({ description: 'Actual delivery date and time' })
  actualDelivery?: Date;

  @ApiPropertyOptional({ description: 'Special pickup instructions' })
  pickupInstructions?: string;

  @ApiPropertyOptional({ description: 'Special delivery instructions' })
  deliveryInstructions?: string;

  @ApiPropertyOptional({ description: 'Special handling requirements' })
  specialHandling?: string;

  @ApiProperty({ description: 'Whether package is fragile' })
  fragile: boolean;

  @ApiProperty({ description: 'Whether package is perishable' })
  perishable: boolean;

  @ApiProperty({ description: 'Whether package contains hazardous material' })
  hazardousMaterial: boolean;

  @ApiProperty({ description: 'Whether package is high value' })
  highValue: boolean;

  @ApiProperty({ description: 'Whether signature is required for delivery' })
  signatureRequired: boolean;

  @ApiPropertyOptional({
    type: CourierAssignmentDto,
    description: 'Courier assignment information',
  })
  courierAssignment?: CourierAssignmentDto;

  @ApiPropertyOptional({
    type: [TrackingHistoryDto],
    description: 'Tracking history entries',
  })
  trackingHistory?: TrackingHistoryDto[];

  @ApiPropertyOptional({
    type: [DeliveryAttemptDto],
    description: 'Delivery attempt history',
  })
  deliveryAttempts?: DeliveryAttemptDto[];

  @ApiPropertyOptional({
    description: 'Distance between pickup and delivery locations (km)',
  })
  distance?: number;

  @ApiPropertyOptional({
    description: 'Estimated earnings for this delivery (KES)',
  })
  estimatedEarnings?: number;

  @ApiProperty({
    enum: PriorityEnum,
    description: 'Delivery priority level',
  })
  priority: PriorityEnum;

  @ApiProperty({ description: 'Date and time when parcel was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date and time when parcel was last updated' })
  updatedAt: Date;
}

// Delivery Status Update DTO
export class DeliveryStatusUpdateDto {
  @ApiProperty({
    enum: ParcelStatusEnum,
    description: 'New status for the parcel',
  })
  @IsEnum(ParcelStatusEnum)
  status: ParcelStatusEnum;

  @ApiPropertyOptional({
    description: 'Location description for status update',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Description of status update' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Courier notes about the status update' })
  @IsOptional()
  @IsString()
  courierNotes?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate of status update' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate of status update' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// Delivery Filters DTO
export class DeliveryFiltersDto {
  @ApiPropertyOptional({
    enum: ParcelStatusEnum,
    description: 'Filter by parcel status',
  })
  @IsOptional()
  @IsEnum(ParcelStatusEnum)
  status?: ParcelStatusEnum;

  @ApiPropertyOptional({
    enum: DeliveryFilterTypeEnum,
    description: 'Filter by pickup or delivery tasks',
  })
  @IsOptional()
  @IsEnum(DeliveryFilterTypeEnum)
  type?: DeliveryFilterTypeEnum;

  @ApiPropertyOptional({
    description: 'Search by tracking number, description, or location',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter deliveries from this date',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter deliveries to this date',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateTo?: Date;

  @ApiPropertyOptional({
    enum: PriorityEnum,
    description: 'Filter by priority level',
  })
  @IsOptional()
  @IsEnum(PriorityEnum)
  priority?: PriorityEnum;
}

// Courier Earnings DTOs
export class DailyEarningsDto {
  @ApiProperty({ description: 'Date of earnings' })
  date: Date;

  @ApiProperty({ description: 'Total earnings for the day (KES)' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of deliveries completed' })
  deliveriesCompleted: number;

  @ApiProperty({ description: 'Number of pickups completed' })
  pickupsCompleted: number;

  @ApiProperty({ description: 'Bonus earnings for the day (KES)' })
  bonusEarnings: number;
}

export class WeeklyEarningsDto {
  @ApiProperty({ description: 'Start date of the week' })
  weekStart: Date;

  @ApiProperty({ description: 'Total earnings for the week (KES)' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of deliveries completed this week' })
  deliveriesCompleted: number;

  @ApiProperty({ description: 'Number of pickups completed this week' })
  pickupsCompleted: number;

  @ApiProperty({ description: 'Average customer rating for the week' })
  averageRating: number;
}

export class MonthlyEarningsDto {
  @ApiProperty({ description: 'Month name' })
  month: string;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Total earnings for the month (KES)' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of deliveries completed this month' })
  deliveriesCompleted: number;

  @ApiProperty({ description: 'Number of pickups completed this month' })
  pickupsCompleted: number;
}

export class CourierEarnings {
  @ApiProperty({
    type: DailyEarningsDto,
    description: 'Daily earnings summary',
  })
  daily: DailyEarningsDto;

  @ApiProperty({
    type: WeeklyEarningsDto,
    description: 'Weekly earnings summary',
  })
  weekly: WeeklyEarningsDto;

  @ApiProperty({
    type: MonthlyEarningsDto,
    description: 'Monthly earnings summary',
  })
  monthly: MonthlyEarningsDto;
}

// Courier Statistics DTO
export class CourierStats {
  @ApiProperty({ description: 'Total number of deliveries assigned' })
  totalDeliveries: number;

  @ApiProperty({ description: 'Number of completed deliveries' })
  completedDeliveries: number;

  @ApiProperty({ description: 'Number of active/pending deliveries' })
  activeDeliveries: number;

  @ApiProperty({ description: 'Success rate as percentage' })
  successRate: number;

  @ApiProperty({ description: 'Total earnings to date (KES)' })
  totalEarnings: number;

  @ApiProperty({ description: 'Average customer rating' })
  averageRating: number;
}

// Quick Status Update DTOs
export class MarkAsPickedUpDto {
  @ApiPropertyOptional({
    description: 'Latitude coordinate of pickup location',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate of pickup location',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Additional pickup notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAsDeliveredDto {
  @ApiPropertyOptional({ description: 'Delivery notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate of delivery location',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate of delivery location',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class MarkAsFailedDto {
  @ApiProperty({ description: 'Reason for delivery failure' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate where failure occurred',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate where failure occurred',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Additional failure notes' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

// Response DTOs
export class DeliveryResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({
    type: CourierDelivery,
    description: 'Updated delivery information',
  })
  data: CourierDelivery;
}

export class DeliveriesListResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: [CourierDelivery], description: 'List of deliveries' })
  data: CourierDelivery[];

  @ApiProperty({ description: 'Total number of deliveries' })
  total: number;
}

export class EarningsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: CourierEarnings, description: 'Earnings data' })
  data: CourierEarnings;
}

export class StatsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: CourierStats, description: 'Courier statistics' })
  data: CourierStats;
}

// Export interface for backward compatibility with the service
export interface DeliveryStatusUpdate {
  parcelId: string;
  status: string;
  location?: string;
  description?: string;
  courierNotes?: string;
  latitude?: number;
  longitude?: number;
  deliveryPhoto?: File;
}

export interface DeliveryFilters {
  status?: string;
  type?: 'PICKUP' | 'DELIVERY';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: string;
}
