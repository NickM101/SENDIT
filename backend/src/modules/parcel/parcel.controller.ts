// src/modules/parcel/parcel.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { GetUser } from '@common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

import { ParcelService } from './parcel.service';
import { AddressService } from '../address/address.service';
import { PricingService } from '../pricing/pricing.service';

import {
  CreateParcelDto,
  ParcelDraftDto,
  PricingRequestDto,
  QuickPricingDto,
  UpdateParcelStatusDto,
  ParcelQueryDto,
  SenderDetailsDto,
  RecipientDetailsDto,
  ParcelDetailsDto,
  DeliveryOptionsDto,
  ValidateAddressDto,
  GeocodeAddressDto,
  ReverseGeocodeDto,
  ParcelResponseDto,
  PaginatedParcelResponseDto,
} from './dto/parcel.dto';
import { Public } from '@app/common/decorators/public.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Parcels')
@UseGuards(JwtAuthGuard)
@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly addressService: AddressService,
    private readonly pricingService: PricingService,
  ) {}

  // ==================== STEP-BY-STEP PARCEL CREATION ====================

  /**
   * Step 1: Save/Validate Sender Details
   */
  @Post('sender-details')
  @ApiOperation({ summary: 'Save and validate sender details (Step 1)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sender details validated and saved',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async saveSenderDetails(
    @Request() req,
    @Body() senderDetailsDto: SenderDetailsDto,
  ) {
    // Validate and save sender details to draft
    const draftData = {
      stepData: { step1: senderDetailsDto },
      currentStep: 1,
    };

    console.log('Saving sender details draft:', draftData);
    console.log('User ID:', req.user.sub);

    await this.parcelService.saveParcelDraft(req.user.sub, draftData);

    // If using map coordinates, validate address
    if (
      senderDetailsDto.pickupAddress.latitude &&
      senderDetailsDto.pickupAddress.longitude
    ) {
      try {
        await this.addressService.reverseGeocode(
          senderDetailsDto.pickupAddress.latitude,
          senderDetailsDto.pickupAddress.longitude,
        );
      } catch (error) {
        throw new BadRequestException('Invalid pickup address coordinates');
      }
    }

    return senderDetailsDto;
  }

  /**
   * Step 2: Save/Validate Recipient Details
   */
  @Post('recipient-details')
  @ApiOperation({ summary: 'Save and validate recipient details (Step 2)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipient details validated and saved',
  })
  async saveRecipientDetails(
    @GetUser() user: any,
    @Body() recipientDetailsDto: RecipientDetailsDto,
  ) {
    // Get existing draft data
    const existingDraft = await this.parcelService.getParcelDraft(user.userId);
    const stepData =
      typeof existingDraft?.stepData === 'object' &&
      existingDraft?.stepData !== null
        ? existingDraft.stepData
        : {};

    // Validate address coordinates
    if (
      recipientDetailsDto.deliveryAddress.latitude &&
      recipientDetailsDto.deliveryAddress.longitude
    ) {
      try {
        await this.addressService.reverseGeocode(
          recipientDetailsDto.deliveryAddress.latitude,
          recipientDetailsDto.deliveryAddress.longitude,
        );
      } catch (error) {
        throw new BadRequestException('Invalid delivery address coordinates');
      }
    }

    // Update draft with step 2 data
    const draftData = {
      stepData: { ...stepData, step2: recipientDetailsDto },
      currentStep: 2,
    };

    await this.parcelService.saveParcelDraft(user.userId, draftData);

    return recipientDetailsDto;
  }

  /**
   * Step 3: Save/Validate Parcel Details
   */
  @Post('parcel-details')
  @ApiOperation({ summary: 'Save and validate parcel details (Step 3)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel details validated and saved',
  })
  async saveParcelDetails(
    @GetUser() user: any,
    @Body() parcelDetailsDto: ParcelDetailsDto,
  ) {
    // Get existing draft data
    const existingDraft = await this.parcelService.getParcelDraft(user.userId);
    const stepData =
      typeof existingDraft?.stepData === 'object' &&
      existingDraft?.stepData !== null
        ? existingDraft.stepData
        : {};

    // Validate package constraints
    if (parcelDetailsDto.specialHandling.hazardousMaterial) {
      throw new BadRequestException(
        'Hazardous materials require special approval. Please contact customer service.',
      );
    }

    // Update draft with step 3 data
    const draftData = {
      stepData: { ...stepData, step3: parcelDetailsDto },
      currentStep: 3,
    };

    await this.parcelService.saveParcelDraft(user.userId, draftData);

    return parcelDetailsDto;
  }

  /**
   * Step 4: Save/Validate Delivery Options
   */
  @Post('delivery-options')
  @ApiOperation({ summary: 'Save and validate delivery options (Step 4)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery options validated and saved',
  })
  async saveDeliveryOptions(
    @GetUser() user: any,
    @Body() deliveryOptionsDto: DeliveryOptionsDto,
  ) {
    // Get existing draft data
    const existingDraft = await this.parcelService.getParcelDraft(user.userId);
    const stepData =
      typeof existingDraft?.stepData === 'object' &&
      existingDraft?.stepData !== null
        ? existingDraft.stepData
        : {};

    // Validate pickup date is not in the past
    const pickupDate = new Date(deliveryOptionsDto.pickupDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (pickupDate < tomorrow) {
      throw new BadRequestException('Pickup date must be at least tomorrow');
    }

    // Update draft with step 4 data
    const draftData = {
      stepData: { ...stepData, step4: deliveryOptionsDto },
      currentStep: 4,
    };

    await this.parcelService.saveParcelDraft(user.userId, draftData);

    return deliveryOptionsDto;
  }

  /**
   * Step 5: Complete Parcel Creation (Final Step)
   */
  @Post('create')
  @ApiOperation({ summary: 'Create parcel with all details (Step 5)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parcel created successfully',
    type: ParcelResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async createParcel(
    @Request() req,
    @Body() createParcelDto: CreateParcelDto,
  ) {
    try {
      const parcel = await this.parcelService.createParcel(
        req.user.sub,
        createParcelDto,
      );

      return {
          id: parcel.id,
          trackingNumber: parcel.trackingNumber,
          status: parcel.status,
          totalPrice: parcel.totalPrice,
          currency: parcel.currency,
          estimatedDelivery: parcel.estimatedDelivery,
          createdAt: parcel.createdAt,
        };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create parcel');
    }
  }

  // ==================== PRICING ENDPOINTS ====================

  /**
   * Calculate detailed pricing for parcel
   */
  @Post('pricing/calculate')
  @ApiOperation({ summary: 'Calculate detailed pricing for parcel' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing calculated successfully',
  })
  async calculatePricing(@Body() pricingRequestDto: PricingRequestDto) {
    const pricing = await this.parcelService.calculatePricing(
      pricingRequestDto.senderData,
      pricingRequestDto.recipientData,
      pricingRequestDto.parcelData,
      pricingRequestDto.deliveryData,
    );

    return {
      success: true,
      message: 'Pricing calculated successfully',
      data: pricing,
    };
  }

  /**
   * Quick pricing estimate
   */
  @Post('pricing/quick-estimate')
  @ApiOperation({ summary: 'Get quick pricing estimate' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quick estimate calculated',
  })
  async getQuickEstimate(@Body() quickPricingDto: QuickPricingDto) {
    const estimate = this.pricingService.calculateQuickEstimate(
      quickPricingDto.weight,
      quickPricingDto.weightUnit,
      quickPricingDto.packageType,
      quickPricingDto.deliveryType,
    );

    return {
      success: true,
      message: 'Quick estimate calculated',
      data: {
        estimate,
        currency: 'KES',
        note: 'This is a quick estimate. Final price may vary based on exact delivery address and additional services.',
      },
    };
  }

  /**
   * Get pricing configuration
   */
  @Get('pricing/config')
  @ApiOperation({ summary: 'Get pricing configuration for frontend' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing configuration retrieved',
  })
  async getPricingConfig() {
    const config = this.pricingService.getPricingConfig();

    return {
      success: true,
      message: 'Pricing configuration retrieved successfully',
      data: config,
    };
  }

  // ==================== PARCEL MANAGEMENT ====================

  /**
   * Get parcels by user (sent parcels)
   */
  @Get('my-parcels')
  @ApiOperation({ summary: 'Get user parcels with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, example: 'PROCESSING' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcels retrieved successfully',
    type: PaginatedParcelResponseDto,
  })
  async getMyParcels(@GetUser() user: any, @Query() queryDto: ParcelQueryDto) {
    const result = await this.parcelService.getParcelsByUser(
      user.userId,
      queryDto.page,
      queryDto.limit,
      queryDto.status as any,
    );

    return result;

  }

  /**
   * Get parcel by tracking number
   */
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track parcel by tracking number' })
  @ApiParam({ name: 'trackingNumber', example: 'ST-20250725001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel tracking information retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parcel not found',
  })
  async trackParcel(@Param('trackingNumber') trackingNumber: string) {
    try {
      const parcel =
        await this.parcelService.getParcelByTrackingNumber(trackingNumber);

      return parcel;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to retrieve parcel tracking information',
      );
    }
  }

  /**
   * Get parcel details by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get parcel details by ID' })
  @ApiParam({ name: 'id', example: 'cuid123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel details retrieved successfully',
  })
  async getParcelById(@Param('id') id: string, @GetUser() user: any) {
    // Note: Add authorization to ensure user can access this parcel
    const parcel = await this.parcelService.getParcelByTrackingNumber(id);

    // Check if user is authorized to view this parcel
    if (parcel.senderId !== user.userId && parcel.recipientId !== user.userId) {
      throw new BadRequestException(
        'You are not authorized to view this parcel',
      );
    }

    return {
      success: true,
      message: 'Parcel details retrieved successfully',
      data: parcel,
    };
  }

  // ==================== DRAFT MANAGEMENT ====================

  /**
   * Get current parcel draft
   */
  @Get('draft/current')
  @ApiOperation({ summary: 'Get current parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft retrieved successfully',
  })
  async getCurrentDraft(@Request() req) {
    const draft = await this.parcelService.getParcelDraft(req.user.sub);

    return {
      success: true,
      message: draft ? 'Draft retrieved successfully' : 'No draft found',
      data: draft,
    };
  }

  /**
   * Save parcel draft
   */
  @Post('draft/save')
  @ApiOperation({ summary: 'Save parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft saved successfully',
  })
  async saveDraft(@GetUser() user: any, @Body() draftDto: ParcelDraftDto) {
    await this.parcelService.saveParcelDraft(user.userId, draftDto);

    return {
      success: true,
      message: 'Draft saved successfully',
    };
  }

  /**
   * Delete parcel draft
   */
  @Delete('draft')
  @ApiOperation({ summary: 'Delete parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft deleted successfully',
  })
  async deleteDraft(@GetUser() user: any) {
    await this.parcelService.deleteParcelDraft(user.userId);

    return {
      success: true,
      message: 'Draft deleted successfully',
    };
  }

  // ==================== SAVED RECIPIENTS ====================

  /**
   * Get saved recipients
   */
  @Get('recipients/saved')
  @ApiOperation({ summary: 'Get saved recipients for user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saved recipients retrieved successfully',
  })
  async getSavedRecipients(@GetUser() user: any) {
    const recipients = await this.parcelService.getSavedRecipients(user.userId);

    return {
      success: true,
      message: 'Saved recipients retrieved successfully',
      data: recipients,
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Update parcel status (Admin only)
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COURIER)
  @ApiOperation({ summary: 'Update parcel status (Admin/Courier only)' })
  @ApiParam({ name: 'id', example: 'cuid123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel status updated successfully',
  })
  async updateParcelStatus(
    @Param('id') parcelId: string,
    @Body() updateStatusDto: UpdateParcelStatusDto,
    @GetUser() user: any,
  ) {
    await this.parcelService.updateParcelStatus(
      parcelId,
      updateStatusDto.status as any,
      updateStatusDto.description,
      updateStatusDto.location,
      user.userId,
    );

    return {
      success: true,
      message: 'Parcel status updated successfully',
    };
  }
}

// ==================== ADDRESS CONTROLLER ====================

@ApiTags('Address & Geocoding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * Validate address
   */
  @Post('validate')
  @ApiOperation({ summary: 'Validate and geocode address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Address validated successfully',
  })
  async validateAddress(@Body() validateAddressDto: ValidateAddressDto) {
    const fullAddress = `${validateAddressDto.street}, ${validateAddressDto.area}, ${validateAddressDto.city}, ${validateAddressDto.county}`;
    const results = await this.addressService.geocodeAddress(fullAddress);

    if (results.length === 0) {
      throw new BadRequestException('Address could not be validated');
    }

    return {
      success: true,
      message: 'Address validated successfully',
      data: results,
    };
  }

  /**
   * Geocode address
   */
  @Post('geocode')
  @ApiOperation({ summary: 'Geocode address to coordinates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Address geocoded successfully',
  })
  async geocodeAddress(@Body() geocodeDto: GeocodeAddressDto) {
    const results = await this.addressService.geocodeAddress(
      geocodeDto.address,
    );

    return {
      success: true,
      message: 'Address geocoded successfully',
      data: results,
    };
  }

  /**
   * Reverse geocode coordinates
   */
  @Post('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coordinates reverse geocoded successfully',
  })
  async reverseGeocode(@Body() reverseGeocodeDto: ReverseGeocodeDto) {
    const result = await this.addressService.reverseGeocode(
      reverseGeocodeDto.latitude,
      reverseGeocodeDto.longitude,
    );

    return {
      success: true,
      message: 'Coordinates reverse geocoded successfully',
      data: result,
    };
  }

  /**
   * Get nearest pickup points
   */
  @Get('pickup-points/nearest')
  @ApiOperation({ summary: 'Get nearest pickup points to coordinates' })
  @ApiQuery({ name: 'latitude', example: -1.2864 })
  @ApiQuery({ name: 'longitude', example: 36.8172 })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearest pickup points retrieved successfully',
  })
  async getNearestPickupPoints(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('limit') limit?: number,
  ) {
    const pickupPoints = await this.addressService.getNearestPickupPoints(
      latitude,
      longitude,
      limit || 5,
    );

    return {
      success: true,
      message: 'Nearest pickup points retrieved successfully',
      data: pickupPoints,
    };
  }

  /**
   * Get Kenyan counties
   */
  @Get('counties')
  @ApiOperation({ summary: 'Get all Kenyan counties' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kenyan counties retrieved successfully',
  })
  async getKenyanCounties() {
    const counties = this.addressService.getKenyanCounties();

    return {
      success: true,
      message: 'Kenyan counties retrieved successfully',
      data: counties,
    };
  }

  /**
   * Get user addresses
   */
  @Get('my-addresses')
  @ApiOperation({ summary: 'Get user saved addresses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User addresses retrieved successfully',
  })
  async getMyAddresses(@GetUser() user: any) {
    const addresses = await this.addressService.getAddressesByUser(user.userId);

    return {
      success: true,
      message: 'User addresses retrieved successfully',
      data: addresses,
    };
  }

  /**
   * Search addresses
   */
  @Get('search')
  @ApiOperation({ summary: 'Search addresses by query' })
  @ApiQuery({ name: 'q', example: 'Nairobi CBD' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Addresses searched successfully',
  })
  async searchAddresses(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    if (!query || query.length < 3) {
      throw new BadRequestException(
        'Search query must be at least 3 characters long',
      );
    }

    const addresses = await this.addressService.searchAddresses(
      query,
      limit || 10,
    );

    return {
      success: true,
      message: 'Addresses searched successfully',
      data: addresses,
    };
  }
}

export class AddressDto {
  street: string;
  area: string;
  city: string;
  county: string;
  state?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
