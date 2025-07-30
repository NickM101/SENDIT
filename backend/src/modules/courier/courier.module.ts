import { Module } from '@nestjs/common';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { PrismaModule } from '@app/prisma/prisma.module';
import { UploadsModule } from '@app/modules/uploads/uploads.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, UploadsModule, NotificationModule],
  controllers: [CourierController],
  providers: [CourierService],
  exports: [CourierService],
})
export class CourierModule {}
