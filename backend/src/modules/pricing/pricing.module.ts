// src/modules/pricing/pricing.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma/prisma.module';
import { PricingService } from './pricing.service';

@Module({
  imports: [PrismaModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
