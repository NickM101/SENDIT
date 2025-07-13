import { IsObject, IsString, IsOptional } from 'class-validator';

export class StripeWebhookDto {
  @IsString()
  id: string;

  @IsString()
  object: string;

  @IsString()
  type: string;

  @IsObject()
  data: any;

  @IsString()
  @IsOptional()
  apiVersion?: string;

  @IsString()
  @IsOptional()
  created?: string;

  @IsString()
  @IsOptional()
  livemode?: boolean;

  @IsString()
  @IsOptional()
  pendingWebhooks?: number;

  @IsString()
  @IsOptional()
  request?: any;
}
