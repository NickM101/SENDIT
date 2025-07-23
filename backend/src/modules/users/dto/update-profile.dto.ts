import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsPhoneNumber,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'john.doe.new@example.com',
    description: `Updated email address`,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Johnathan Doe',
    description: `Updated full name`,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '+1987654321',
    description: `Updated phone number`,
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    example: '1995-05-10',
    description: `Updated date of birth`,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({
    example: '456 Oak Ave, City, Country',
    description: `Updated address`,
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'http://example.com/new_avatar.jpg',
    description: `New URL to user's avatar image`,
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    example: false,
    description: `Whether to receive email notifications`,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({
    example: true,
    description: `Whether to receive SMS notifications`,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;
}