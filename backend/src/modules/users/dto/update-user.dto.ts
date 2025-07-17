import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'updated.email@example.com', description: `Updated email address`, required: false })
  email?: string;

  @ApiProperty({ example: 'Updated Name', description: `Updated full name`, required: false })
  name?: string;

  @ApiProperty({ example: '+1987654321', description: `Updated phone number`, required: false })
  phone?: string;

  @ApiProperty({ example: 'NewPassword123', description: `Updated password (min 8 characters)`, required: false })
  password?: string;

  @ApiProperty({ example: '1995-05-10', description: `Updated date of birth`, required: false })
  dateOfBirth?: Date;

  @ApiProperty({ example: '456 Oak Ave, City, Country', description: `Updated address`, required: false })
  address?: string;

  @ApiProperty({ example: false, description: `Whether the user account is active`, required: false })
  isActive?: boolean;

  @ApiProperty({ example: 'http://example.com/new_avatar.jpg', description: `URL to user's avatar image`, required: false })
  avatarUrl?: string;

  @ApiProperty({ example: false, description: `Whether to send email notifications`, required: false })
  emailNotifications?: boolean;

  @ApiProperty({ example: true, description: `Whether to send SMS notifications`, required: false })
  smsNotifications?: boolean;
}
