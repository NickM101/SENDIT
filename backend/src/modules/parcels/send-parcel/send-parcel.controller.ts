// src/modules/parcels/send-parcel/send-parcel.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SendParcelService } from './send-parcel.service';

@Controller('parcels/send')
@UseGuards(JwtAuthGuard)
export class SendParcelController {
  constructor(
    private readonly sendParcelService: SendParcelService,
  ) {}

  // Initialize send parcel session
  @Get('initialize')
  async initializeSendParcel(@Request() req) {
    return this.sendParcelService.initializeSession(req.user.id);
  }

  // Get real-time pricing
  @Post('calculate-price')
  async calculatePrice(@Body() parcelData: any, @Request() req) {
    // return this.pricingService.calculateRealTimePrice(parcelData, req.user.id);
  }

  // Save draft
  @Post('draft')
  async saveDraft(@Body() draftData: any, @Request() req) {
    // return this.draftService.saveDraft(req.user.id, draftData);
  }

  // Load existing draft
  @Get('draft')
  async loadDraft(@Request() req) {
    // return this.draftService.loadDraft(req.user.id);
  }

  // Validate step data
  @Post('validate-step/:stepNumber')
  async validateStep(
    @Param('stepNumber') stepNumber: number,
    @Body() stepData: any,
    @Request() req,
  ) {
    return this.sendParcelService.validateStep(
      stepNumber,
      stepData,
      req.user.id,
    );
  }

  // Get user's saved addresses
  @Get('addresses')
  async getSavedAddresses(@Request() req) {
    return this.sendParcelService.getUserAddresses(req.user.id);
  }

  // Get recent recipients
  @Get('recent-recipients')
  async getRecentRecipients(@Request() req) {
    return this.sendParcelService.getRecentRecipients(req.user.id);
  }

  // Submit final parcel
  @Post('submit')
  async submitParcel(@Body() parcelData: any, @Request() req) {
    return this.sendParcelService.createParcel(parcelData, req.user.id);
  }
}
