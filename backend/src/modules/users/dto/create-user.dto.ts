import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsPhoneNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: `User's email address`,
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: `User's full name` })
  @IsString()
  name: string;

  @ApiProperty({ example: '+254707757081', description: `User's phone number` })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: '1Password!',
    description: `User's password (min 8 characters)`,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'USER', description: `User's role`, enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    example: '1990-01-01T00:00:00.000Z',
    description: `User's date of birth`,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({
    example: false,
    description: `Whether the user account is active`,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example:
      'https://images.icon-icons.com/3446/PNG/512/account_profile_user_avatar_icon_219236.png',
    description: `URL to user's avatar image`,
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    example: true,
    description: `Whether to send email notifications`,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({
    example: false,
    description: `Whether to send SMS notifications`,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;
}
