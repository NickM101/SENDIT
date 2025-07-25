// src/modules/payment/payment.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma/prisma.service';
import { PaymentStatus, PaymentMethod, ParcelStatus } from '@prisma/client';
import Stripe from 'stripe';

export interface CreatePaymentIntentDto {
  amount: number; // Amount in KES cents (e.g., 250000 for KES 2500)
  currency?: string;
  parcelId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
  parcelId: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Stripe with test credentials
    const stripeSecretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_51234567890abcdef'; // Fallback test key

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(createPaymentDto: CreatePaymentIntentDto) {
    try {
      this.logger.log(
        `Creating payment intent for amount: ${createPaymentDto.amount}`,
      );

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(createPaymentDto.amount), // Ensure integer
        currency: createPaymentDto.currency || 'kes',
        description: createPaymentDto.description || 'SendIT Parcel Payment',
        metadata: createPaymentDto.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Save payment record to database
      const payment = await this.prisma.payment.create({
        data: {
          stripePaymentIntentId: paymentIntent.id,
          amount: createPaymentDto.amount / 100, // Convert back to KES
          currency: createPaymentDto.currency || 'KES',
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          stripeClientSecret: paymentIntent.client_secret,
          parcelId: createPaymentDto.parcelId,
          paymentIntentMetadata: paymentIntent.metadata as any,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: createPaymentDto.amount / 100,
        currency: createPaymentDto.currency || 'KES',
        paymentId: payment.id,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment and update parcel status
   */
  async confirmPayment(confirmPaymentDto: ConfirmPaymentDto) {
    try {
      this.logger.log(
        `Confirming payment: ${confirmPaymentDto.paymentIntentId}`,
      );

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        confirmPaymentDto.paymentIntentId,
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment has not been completed');
      }

      // Update payment status in database
      const payment = await this.prisma.payment.update({
        where: { stripePaymentIntentId: confirmPaymentDto.paymentIntentId },
        data: {
          status: PaymentStatus.PAID,
          paymentIntentMetadata: paymentIntent.metadata as any,
        },
      });

      // Update parcel status if parcel ID provided
      if (confirmPaymentDto.parcelId) {
        await this.prisma.parcel.update({
          where: { id: confirmPaymentDto.parcelId },
          data: { status: ParcelStatus.PAYMENT_CONFIRMED },
        });

        // Create tracking history entry
        await this.prisma.trackingHistory.create({
          data: {
            parcelId: confirmPaymentDto.parcelId,
            status: ParcelStatus.PAYMENT_CONFIRMED,
            description: 'Payment confirmed, parcel ready for pickup',
          },
        });
      }

      this.logger.log(
        `Payment confirmed successfully: ${confirmPaymentDto.paymentIntentId}`,
      );

      return {
        success: true,
        paymentId: payment.id,
        paymentIntentId: confirmPaymentDto.paymentIntentId,
        status: 'paid',
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      this.logger.error(
        `Failed to confirm payment: ${confirmPaymentDto.paymentIntentId}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(signature: string, body: Buffer) {
    try {
      const webhookSecret = this.configService.get<string>(
        'STRIPE_WEBHOOK_SECRET',
      );

      if (!webhookSecret) {
        this.logger.warn('Stripe webhook secret not configured');
        return;
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Failed to handle webhook event', error);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          parcel: {
            select: { trackingNumber: true, status: true },
          },
        },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      return payment;
    } catch (error) {
      this.logger.error(`Failed to get payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to retrieve payment');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (payment.status !== PaymentStatus.PAID) {
        throw new BadRequestException('Payment cannot be refunded');
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId!,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason: reason as any,
        metadata: {
          paymentId,
          parcelId: payment.parcelId || '',
        },
      });

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status:
            amount && amount < payment.amount
              ? PaymentStatus.PARTIALLY_REFUNDED
              : PaymentStatus.REFUNDED,
        },
      });

      this.logger.log(`Payment refunded: ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
      };
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to refund payment');
    }
  }

  // Private webhook handlers
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: PaymentStatus.PAID },
      });

      // Update related parcel status
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (payment?.parcelId) {
        await this.prisma.parcel.update({
          where: { id: payment.parcelId },
          data: { status: ParcelStatus.PAYMENT_CONFIRMED },
        });

        // Create tracking history
        await this.prisma.trackingHistory.create({
          data: {
            parcelId: payment.parcelId,
            status: ParcelStatus.PAYMENT_CONFIRMED,
            description: 'Payment confirmed via webhook',
          },
        });
      }

      this.logger.log(
        `Payment succeeded webhook processed: ${paymentIntent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment succeeded webhook: ${paymentIntent.id}`,
        error,
      );
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: PaymentStatus.FAILED },
      });

      this.logger.log(`Payment failed webhook processed: ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process payment failed webhook: ${paymentIntent.id}`,
        error,
      );
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: PaymentStatus.FAILED },
      });

      this.logger.log(
        `Payment canceled webhook processed: ${paymentIntent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment canceled webhook: ${paymentIntent.id}`,
        error,
      );
    }
  }
}
