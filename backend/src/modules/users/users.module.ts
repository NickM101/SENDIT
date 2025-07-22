import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UploadsModule } from '@app/modules/uploads/uploads.module';
import { AuthModule } from '@app/modules/auth/auth.module';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [UploadsModule, AuthModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
