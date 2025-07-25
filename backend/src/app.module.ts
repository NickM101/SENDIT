// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmailModule } from './modules/email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AddressModule } from './modules/address/address.module';
import { ParcelModule } from './modules/parcel/parcel.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PickupPointModule } from './modules/pickup-point/pickup-point.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    UploadsModule,
    ParcelModule,
    AddressModule,
    PricingModule,
    PaymentModule,
    PickupPointModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}