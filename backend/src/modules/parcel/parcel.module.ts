// src/modules/parcel/parcel.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@app/prisma/prisma.module';
import { ParcelController } from './parcel.controller';
import { ParcelService } from './parcel.service';
import { AddressService } from '../address/address.service';
import { PricingService } from '../pricing/pricing.service';
import { PickupPointService } from '../pickup-point/pickup-point.service';
import { ParcelAssignmentService } from './services/parcel-assignment.service';
import { ParcelCreationService } from './services/parcel-creation.service';
import { ParcelQueryService } from './services/parcel-query.service';
import { ParcelRecipientService } from './services/parcel-recipient.service';
import { ParcelTrackingService } from './services/parcel-tracking.service';
import { AdminParcelController } from './admin-parcel.controller';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [ParcelController, AdminParcelController],
  providers: [
    ParcelService,
    AddressService,
    PricingService,
    PickupPointService,
    ParcelCreationService,
    ParcelAssignmentService,
    ParcelTrackingService,
    ParcelQueryService,
    ParcelRecipientService,
  ],
  exports: [ParcelService, AddressService, PricingService, PickupPointService],
})
export class ParcelModule {}


