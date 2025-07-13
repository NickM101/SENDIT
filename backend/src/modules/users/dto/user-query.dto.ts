import { IsOptional, IsString, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserQueryDto {
  @ApiProperty({ example: 'john', description: 'Search term for email, name, or phone', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 1, description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ example: Role.USER, description: 'Filter users by role', enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: true, description: 'Filter users by active status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}