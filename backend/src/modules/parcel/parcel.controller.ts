// src/modules/parcel/controllers/parcel.controller.ts
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
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role, ParcelStatus } from '@prisma/client';
import { AddressService } from '../address/address.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PricingService } from '../pricing/pricing.service';
import { SenderDetailsDto, RecipientDetailsDto, ParcelDetailsDto, DeliveryOptionsDto, CreateParcelDto, PricingRequestDto, QuickPricingDto, PaginatedParcelResponseDto, ParcelQueryDto, ParcelDraftDto, UpdateParcelStatusDto, ParcelStatsDto } from './dto/parcel.dto';
import { ParcelService } from './parcel.service';

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

  // ==================== STEP-BY-STEP PARCEL CREATION (User) ====================
  /**
   * Step 1: Save/Validate Sender Details
   */
  @Post('sender-details')
  @ApiOperation({ summary: 'Save and validate sender details (Step 1)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sender details validated and saved',
    schema: {
      example: {
        success: true,
        message: 'Sender details saved',
        data: {
          /* SenderDetailsDto object */
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async saveSenderDetails(
    @Request() req,
    @Body() senderDetailsDto: SenderDetailsDto,
  ) {
    try {
      // Validate and save sender details to draft
      const draftData = {
        stepData: { step1: senderDetailsDto },
        currentStep: 1,
      };
      await this.parcelService.saveParcelDraft(req.user.sub, draftData);

      // If using map coordinates, validate address
      if (
        senderDetailsDto.pickupAddress.latitude &&
        senderDetailsDto.pickupAddress.longitude
      ) {
        await this.addressService.reverseGeocode(
          senderDetailsDto.pickupAddress.latitude,
          senderDetailsDto.pickupAddress.longitude,
        );
      }

      return {
        success: true,
        message: 'Sender details saved',
        data: senderDetailsDto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save sender details');
    }
  }

  /**
   * Step 2: Save/Validate Recipient Details
   */
  @Post('recipient-details')
  @ApiOperation({ summary: 'Save and validate recipient details (Step 2)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipient details validated and saved',
    schema: {
      example: {
        success: true,
        message: 'Recipient details saved',
        data: {
          /* RecipientDetailsDto object */
        },
      },
    },
  })
  async saveRecipientDetails(
    @GetUser() user: any,
    @Body() recipientDetailsDto: RecipientDetailsDto,
  ) {
    try {
      // Get existing draft data
      const existingDraft = await this.parcelService.getParcelDraft(
        user.userId,
      );
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
        await this.addressService.reverseGeocode(
          recipientDetailsDto.deliveryAddress.latitude,
          recipientDetailsDto.deliveryAddress.longitude,
        );
      }

      // Update draft with step 2 data
      const draftData = {
        stepData: { ...stepData, step2: recipientDetailsDto },
        currentStep: 2,
      };
      await this.parcelService.saveParcelDraft(user.userId, draftData);

      return {
        success: true,
        message: 'Recipient details saved',
        data: recipientDetailsDto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save recipient details');
    }
  }

  /**
   * Step 3: Save/Validate Parcel Details
   */
  @Post('parcel-details')
  @ApiOperation({ summary: 'Save and validate parcel details (Step 3)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel details validated and saved',
    schema: {
      example: {
        success: true,
        message: 'Parcel details saved',
        data: {
          /* ParcelDetailsDto object */
        },
      },
    },
  })
  async saveParcelDetails(
    @GetUser() user: any,
    @Body() parcelDetailsDto: ParcelDetailsDto,
  ) {
    try {
      // Get existing draft data
      const existingDraft = await this.parcelService.getParcelDraft(
        user.userId,
      );
      const stepData =
        typeof existingDraft?.stepData === 'object' &&
        existingDraft?.stepData !== null
          ? existingDraft.stepData
          : {};

      // Validate package constraints (example)
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

      return {
        success: true,
        message: 'Parcel details saved',
        data: parcelDetailsDto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save parcel details');
    }
  }

  /**
   * Step 4: Save/Validate Delivery Options
   */
  @Post('delivery-options')
  @ApiOperation({ summary: 'Save and validate delivery options (Step 4)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery options validated and saved',
    schema: {
      example: {
        success: true,
        message: 'Delivery options saved',
        data: {
          /* DeliveryOptionsDto object */
        },
      },
    },
  })
  async saveDeliveryOptions(
    @GetUser() user: any,
    @Body() deliveryOptionsDto: DeliveryOptionsDto,
  ) {
    try {
      // Get existing draft data
      const existingDraft = await this.parcelService.getParcelDraft(
        user.userId,
      );
      const stepData =
        typeof existingDraft?.stepData === 'object' &&
        existingDraft?.stepData !== null
          ? existingDraft.stepData
          : {};

      // Validate pickup date is not in the past (example)
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

      return {
        success: true,
        message: 'Delivery options saved',
        data: deliveryOptionsDto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save delivery options');
    }
  }

  /**
   * Step 5: Complete Parcel Creation (Final Step)
   */
  @Post('create')
  @ApiOperation({ summary: 'Create parcel with all details (Step 5)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parcel created successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcel created successfully',
        data: {
          /* Simplified ParcelResponseDto object */
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createParcel(@Request() req, @Body() createParcelDto: CreateParcelDto) {
    try {
      const parcel = await this.parcelService.createParcel(
        req.user.sub,
        createParcelDto,
      );
      return {
        success: true,
        message: 'Parcel created successfully',
        data: {
          id: parcel.id,
          trackingNumber: parcel.trackingNumber,
          status: parcel.status,
          totalPrice: parcel.totalPrice,
          currency: parcel.currency,
          estimatedDelivery: parcel.estimatedDelivery,
          createdAt: parcel.createdAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create parcel');
    }
  }

  // ==================== PRICING ENDPOINTS (User) ====================
  /**
   * Calculate detailed pricing for parcel
   */
  @Post('pricing/calculate')
  @ApiOperation({ summary: 'Calculate detailed pricing for parcel' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing calculated successfully',
    schema: {
      example: {
        success: true,
        message: 'Pricing calculated successfully',
        data: {
          /* Full pricing breakdown object from PricingService */
        },
      },
    },
  })
  async calculatePricing(@Body() pricingRequestDto: PricingRequestDto) {
    try {
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
    } catch (error) {
      throw new BadRequestException('Failed to calculate pricing');
    }
  }

  /**
   * Quick pricing estimate
   */
  @Post('pricing/quick-estimate')
  @Public() // Allow public access if desired
  @ApiOperation({ summary: 'Get quick pricing estimate' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quick estimate calculated',
    schema: {
      example: {
        success: true,
        message: 'Quick estimate calculated',
        data: {
          /* Quick estimate data */
        },
      },
    },
  })
  async getQuickEstimate(@Body() quickPricingDto: QuickPricingDto) {
    try {
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
    } catch (error) {
      throw new BadRequestException('Failed to calculate quick estimate');
    }
  }

  // ==================== PARCEL MANAGEMENT (User) ====================
  /**
   * Get parcels by user (sent parcels)
   */
  @Get('my-parcels')
  @ApiOperation({ summary: 'Get user parcels with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcels retrieved successfully',
    type: PaginatedParcelResponseDto,
  })
  async getMyParcels(@Request() req, @Query() queryDto: ParcelQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        trackingNumber,
        startDate,
        endDate,
      } = queryDto;
      const result = await this.parcelService.getParcelsByUser(
        req.user.sub,
        page,
        limit,
        status as ParcelStatus | undefined,
        trackingNumber,
        startDate,
        endDate,
      );
      return {
        success: true,
        message: 'Parcels retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve parcels');
    }
  }

  @Get('stats')
  @ApiResponse({
    status: 200,
    description: 'Parcel statistics retrieved successfully.',
    type: ParcelStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getStats(@Request() req): Promise<ParcelStatsDto> {
    // Assumes GetCurrentUser extracts the full User object from the JWT
    return this.parcelService.getParcelStats(req.user.sub);
  }

  /**
   * Get parcel by tracking number (User/Courier)
   */
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track parcel by tracking number (Public)' })
  @Public() // Allow public tracking
  @ApiParam({ name: 'trackingNumber', example: 'ST-20250725001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel tracking information retrieved',
    schema: {
      example: {
        success: true,
        message: 'Parcel details retrieved',
        data: {
          /* Full parcel object with history */
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parcel not found',
  })
  async trackParcel(@Param('trackingNumber') trackingNumber: string) {
    try {
      const parcel =
        await this.parcelService.getParcelByTrackingNumber(trackingNumber);
      return {
        success: true,
        message: 'Parcel details retrieved',
        data: parcel,
      };
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
   * Get parcel details by ID (User - must own parcel)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get parcel details by ID (Owner only)' })
  @ApiParam({ name: 'id', example: 'cuid123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel details retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcel details retrieved successfully',
        data: {
          /* Full parcel object */
        },
      },
    },
  })
  async getParcelById(@Param('id') id: string, @GetUser() user: any) {
    try {
      // Note: This endpoint name is confusing with track/:trackingNumber.
      // Better to use track/:trackingNumber for tracking.
      // This could be for getting full details by Parcel ID if needed internally.
      // Let's assume it gets by Tracking Number for consistency.
      const parcel = await this.parcelService.getParcelByTrackingNumber(id); // Or by Parcel ID if preferred
      // Check if user is authorized to view this parcel
      if (
        parcel.senderId !== user.userId &&
        parcel.recipientId !== user.userId
      ) {
        throw new BadRequestException(
          'You are not authorized to view this parcel',
        );
      }
      return {
        success: true,
        message: 'Parcel details retrieved successfully',
        data: parcel,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve parcel details');
    }
  }

  // ==================== DRAFT MANAGEMENT (User) ====================
  /**
   * Get current parcel draft
   */
  @Get('draft/current')
  @ApiOperation({ summary: 'Get current parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Draft retrieved successfully',
        data: {
          /* ParcelDraft object or null */
        },
      },
    },
  })
  async getCurrentDraft(@Request() req) {
    try {
      const draft = await this.parcelService.getParcelDraft(req.user.sub);
      return {
        success: true,
        message: draft ? 'Draft retrieved successfully' : 'No draft found',
        data: draft,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve draft');
    }
  }

  /**
   * Save parcel draft (Generic save, not step-specific)
   */
  @Post('draft/save')
  @ApiOperation({ summary: 'Save parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft saved successfully',
    schema: {
      example: {
        success: true,
        message: 'Draft saved successfully',
      },
    },
  })
  async saveDraft(@GetUser() user: any, @Body() draftDto: ParcelDraftDto) {
    try {
      await this.parcelService.saveParcelDraft(user.userId, draftDto);
      return {
        success: true,
        message: 'Draft saved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to save draft');
    }
  }

  /**
   * Delete parcel draft
   */
  @Delete('draft')
  @ApiOperation({ summary: 'Delete parcel draft' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Draft deleted successfully',
      },
    },
  })
  async deleteDraft(@GetUser() user: any) {
    try {
      await this.parcelService.deleteParcelDraft(user.userId);
      return {
        success: true,
        message: 'Draft deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete draft');
    }
  }

  // ==================== SAVED RECIPIENTS (User) ====================
  /**
   * Get saved recipients
   */
  @Get('recipients/saved')
  @ApiOperation({ summary: 'Get saved recipients for user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saved recipients retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Saved recipients retrieved successfully',
        data: [
          /* Array of saved recipients */
        ],
      },
    },
  })
  async getSavedRecipients(@GetUser() user: any) {
    try {
      const recipients = await this.parcelService.getSavedRecipients(
        user.userId,
      );
      return {
        success: true,
        message: 'Saved recipients retrieved successfully',
        data: recipients,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve saved recipients');
    }
  }

  // ==================== STATUS UPDATES (Courier) ====================
  /**
   * Update parcel status (Courier only)
   * Note: This assumes the enhanced updateParcelStatus with validation is used.
   * If not, adjust the service call accordingly.
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.COURIER)
  @ApiOperation({ summary: 'Update parcel status (Courier only)' })
  @ApiParam({ name: 'id', example: 'cuid123' })
  @ApiBody({
    description: 'Status update details',
    schema: {
      example: {
        status: 'IN_TRANSIT',
        description: 'Parcel picked up and is in transit',
        location: 'Nairobi Hub',
        latitude: -1.2921,
        longitude: 36.8219,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel status updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcel status updated successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or data',
  })
  async updateParcelStatus(
    @Param('id') parcelId: string,
    @Body() updateStatusDto: UpdateParcelStatusDto, // Ensure this DTO matches expected fields
    @GetUser() user: any,
  ) {
    try {
      await this.parcelService.updateParcelStatus(
        parcelId,
        updateStatusDto.status as ParcelStatus, // Ensure enum conversion
        updateStatusDto.description,
        updateStatusDto.location,
        user.userId, // Courier ID
      );
      return {
        success: true,
        message: 'Parcel status updated successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update parcel status');
    }
  }

  // Placeholder for potential future endpoints like cancelling a parcel
  // @Delete(':id')
  // @ApiOperation({ summary: 'Cancel a parcel (if allowed by business rules)' })
  // async cancelParcel(@Param('id') parcelId: string, @GetUser() user: any) { ... }
}
