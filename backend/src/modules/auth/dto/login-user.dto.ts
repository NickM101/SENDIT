import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'xofod49446@forexru.com',
    description: `User's email address`,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '1Password!',
    description: `User's password`,
  })
  @IsString()
  password: string;
}
