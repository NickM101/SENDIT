import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum PaymentMethodType {
  CARD = 'card',
  // Add other payment methods as needed
}

export class CreatePaymentDto {
  @IsNumber()
  amount: number; // Amount in cents

  @IsString()
  currency: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  parcelId?: string;

  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethodType?: PaymentMethodType;
}
