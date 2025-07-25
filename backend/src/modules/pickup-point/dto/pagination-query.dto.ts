import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsEnum, IsString } from 'class-validator';

export enum PickupPointSortField {
  NAME = 'name',
  CITY = 'city',
  COUNTY = 'county',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: PickupPointSortField,
    example: PickupPointSortField.CITY,
  })
  @IsOptional()
  @IsEnum(PickupPointSortField)
  sortBy?: PickupPointSortField = PickupPointSortField.COUNTY;

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
