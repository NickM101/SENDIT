// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ParcelsModule } from './parcels/parcels.module';
import { EmailModule } from './modules/email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from './payments/payments.module'; // Import PaymentsModule
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ParcelsModule,
    EmailModule,
    PaymentsModule, // Add PaymentsModule here
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}