import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsPositive,
} from 'class-validator';
import { KenyanCounty, PickupPointType } from '@prisma/client';

export enum PickupPointSortField {
  NAME = 'name',
  CITY = 'city',
  COUNTY = 'county',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
}

export class PickupPointQueryDto {
  // Filters

  @ApiPropertyOptional({ enum: PickupPointType })
  @IsOptional()
  @IsEnum(PickupPointType)
  type?: PickupPointType;
  
  @ApiPropertyOptional({ enum: KenyanCounty })
  @IsOptional()
  @IsEnum(KenyanCounty)
  county?: KenyanCounty;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  // Pagination
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  // Sorting
  @ApiPropertyOptional({
    enum: PickupPointSortField,
    default: PickupPointSortField.COUNTY,
  })
  @IsOptional()
  @IsEnum(PickupPointSortField)
  sortBy?: PickupPointSortField = PickupPointSortField.COUNTY;

  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
