// src/modules/parcel/parcel.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@app/prisma/prisma.module';
import { ParcelController, AddressController } from './parcel.controller';
import { ParcelService } from './parcel.service';
import { AddressService } from '../address/address.service';
import { PricingService } from '../pricing/pricing.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [ParcelController, AddressController],
  providers: [ParcelService, AddressService, PricingService],
  exports: [ParcelService, AddressService, PricingService],
})
export class ParcelModule {}


