import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}