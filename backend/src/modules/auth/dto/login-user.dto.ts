import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: `User's email address`,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: `User's password`,
  })
  @IsString()
  password: string;
}
