import { PartialType } from '@nestjs/mapped-types';
import { UpdateProfileDto } from './update-profile.dto';
import { IsBoolean, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserByAdminDto extends PartialType(UpdateProfileDto) {
  @ApiProperty({ example: true, description: 'Whether the user account is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: [Role.ADMIN], description: 'Array of roles assigned to the user', enum: Role, isArray: true, required: false })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiProperty({ example: 'NewAdminPassword789', description: 'New password for the user (min 8 characters), only for admin updates', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}