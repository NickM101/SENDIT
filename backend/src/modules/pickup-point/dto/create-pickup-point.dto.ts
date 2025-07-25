import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickupPointType, KenyanCounty } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreatePickupPointDto {
  @ApiProperty({ example: 'SendIT Nairobi Center' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PickupPointType })
  @IsEnum(PickupPointType)
  type: PickupPointType;

  @ApiProperty({ example: 'Moi Avenue, Nairobi' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ enum: KenyanCounty })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiProperty({ example: -1.2921 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 36.8219 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'Mon-Fri 8am-6pm' })
  @IsString()
  @IsNotEmpty()
  hours: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'nairobi-center@sendit.co.ke' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: ['Drop-off', 'Pickup'] })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
