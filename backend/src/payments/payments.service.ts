// backend/src/payments/payments.service.ts
import { Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ParcelStatus } from '@prisma/client'; // Assuming ParcelStatus is available

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20', // Use a recent API version
    });
  }

  async createPaymentIntent(createPaymentDto: CreatePaymentDto) {
    const { amount, currency, paymentMethodId, parcelId } = createPaymentDto;

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        confirm: true, // Confirm the payment immediately
        return_url: 'http://localhost:4200/payment-success', // Frontend success URL
        metadata: {
          parcelId: parcelId, // Associate payment with a parcel
        },
      });

      // Save payment intent details to your database
      await this.prisma.payment.create({
        data: {
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          parcel: parcelId ? { connect: { id: parcelId } } : undefined,
        },
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful!`);
        // Update your database with the successful payment status
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentSucceeded.id },
          data: { status: paymentIntentSucceeded.status },
        });

        // Optionally, update parcel status if payment is for a parcel
        const parcelId = paymentIntentSucceeded.metadata?.parcelId;
        if (parcelId) {
          await this.prisma.parcel.update({
            where: { id: parcelId },
            data: {
              // Assuming you have a payment status field in Parcel or a related model
              // For now, let's just log it. You might want to change parcel status to 'PAID' or similar.
              // status: ParcelStatus.PROCESSING, // Example: if payment confirms processing can start
            },
          });
        }
        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent for ${paymentIntentFailed.amount} failed.`);
        // Update your database with the failed payment status
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentFailed.id },
          data: { status: paymentIntentFailed.status },
        });
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}