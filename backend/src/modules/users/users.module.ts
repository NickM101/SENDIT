import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UploadsModule } from '@app/modules/uploads/uploads.module';
import { AuthModule } from '@app/modules/auth/auth.module';

@Module({
  imports: [UploadsModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
