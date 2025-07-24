// src/modules/parcels/send-parcel/send-parcel.module.ts
import { Module } from '@nestjs/common';
import { SendParcelController } from './send-parcel.controller';
import { SendParcelService } from './send-parcel.service';


@Module({
  controllers: [SendParcelController],
  providers: [SendParcelService],
  exports: [SendParcelService],
})
export class SendParcelModule {}
