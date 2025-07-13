import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123', description: 'Current password of the user' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPassword456', description: 'New password for the user (min 8 characters)' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}