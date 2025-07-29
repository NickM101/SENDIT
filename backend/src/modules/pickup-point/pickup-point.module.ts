import { Module } from '@nestjs/common';
import { PickupPointService } from './pickup-point.service';
import { PickupPointController } from './pickup-point.controller';
import { PrismaModule } from '@app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PickupPointController],
  providers: [PickupPointService],
  exports: [PickupPointService],
})
export class PickupPointModule {}


