import { IsString, IsNumber, IsEnum, IsObject, IsOptional, Min, IsBoolean, IsDateString } from 'class-validator';
import { PackageType, DeliveryType, InsuranceCoverage } from '@prisma/client';

export class CreateParcelDto {
  @IsString()
  recipientName: string;

  @IsString()
  recipientEmail: string;

  @IsString()
  recipientPhone: string;

  @IsObject()
  senderAddress: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @IsObject()
  recipientAddress: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsNumber()
  @Min(0.1)
  weight: number;

  @IsObject()
  @IsOptional()
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };

  @IsEnum(DeliveryType)
  @IsOptional()
  deliveryType?: DeliveryType;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(InsuranceCoverage)
  @IsOptional()
  insuranceCoverage?: InsuranceCoverage;

  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @IsString()
  @IsOptional()
  deliveryInstructions?: string;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  fragile?: boolean;

  @IsBoolean()
  @IsOptional()
  perishable?: boolean;

  @IsBoolean()
  @IsOptional()
  hazardousMaterial?: boolean;

  @IsBoolean()
  @IsOptional()
  highValue?: boolean;
}
