// backend/src/payments/payments.controller.ts
import { Controller, Post, Body, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public } from '../common/decorators/public.decorator'; // Assuming Public decorator exists

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  @Public() // Webhooks typically don't require authentication
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(req, signature);
  }
}