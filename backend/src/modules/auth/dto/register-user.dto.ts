import { CreateUserDto } from '@app/modules/users/dto/create-user.dto';
import { IsStrongPassword } from 'class-validator';

export class RegisterUserDto extends CreateUserDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  declare password: string;
}
