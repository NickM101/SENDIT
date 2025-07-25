// src/modules/address/address.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@app/prisma/prisma.module';
import { AddressService } from './address.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
