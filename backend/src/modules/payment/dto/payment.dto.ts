import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount in KES cents (e.g., 250000 for KES 2500)',
    example: 250000,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code (default is KES)',
    example: 'kes',
    default: 'kes',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Optional Parcel ID associated with this payment',
    example: 'parcel_abc123',
  })
  parcelId?: string;

  @ApiPropertyOptional({
    description: 'Payment description for the charge',
    example: 'Payment for Parcel Delivery',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional metadata key-value pairs',
    example: { orderId: 'ORD-456', customerNote: 'Handle with care' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  metadata?: Record<string, string>;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Stripe Payment Intent ID to confirm',
    example: 'pi_1Hh1pZIyNTgGDVt5t1XxyzAB',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Parcel ID related to this payment',
    example: 'parcel_abc123',
  })
  parcelId: string;
}
