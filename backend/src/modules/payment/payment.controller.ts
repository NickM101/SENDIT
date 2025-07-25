// src/modules/payment/payment.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBody,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';
import {
  PaymentService,
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
} from './payment.service';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create payment intent
   */
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  async createPaymentIntent(
    @Body() createPaymentDto: CreatePaymentIntentDto,
    @Request() req,
  ) {
    const result = await this.paymentService.createPaymentIntent({
      ...createPaymentDto,
      metadata: {
        ...createPaymentDto.metadata,
        userId: req.user.sub,
      },
    });

    return {
      success: true,
      message: 'Payment intent created successfully',
      data: result,
    };
  }

  /**
   * Confirm payment
   */
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment completion' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment confirmed successfully',
  })
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
    @Request() req,
  ) {
    const result = await this.paymentService.confirmPayment(confirmPaymentDto);

    return {
      success: true,
      message: 'Payment confirmed successfully',
      data: result,
    };
  }

  /**
   * Get payment details
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
  })
  async getPayment(@Param('id') paymentId: string) {
    const payment = await this.paymentService.getPaymentById(paymentId);

    return {
      success: true,
      message: 'Payment details retrieved successfully',
      data: payment,
    };
  }

  /**
   * Stripe webhook endpoint
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() body: Buffer,
  ) {
    return await this.paymentService.handleWebhookEvent(signature, body);
  }

  /**
   * Refund payment (Admin only - implement role guard as needed)
   */
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
  })
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() refundData: { amount?: number; reason?: string },
  ) {
    const result = await this.paymentService.refundPayment(
      paymentId,
      refundData.amount,
      refundData.reason,
    );

    return {
      success: true,
      message: 'Payment refunded successfully',
      data: result,
    };
  }
}
