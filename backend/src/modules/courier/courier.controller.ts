// src/modules/courier/courier.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CourierService } from './courier.service';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/modules/auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import {
  CourierDelivery,
  DeliveryStatusUpdateDto,
  DeliveryFiltersDto,
  CourierEarnings,
  CourierStats,
  MarkAsPickedUpDto,
  MarkAsDeliveredDto,
  MarkAsFailedDto,
  DeliveryResponseDto,
  DeliveriesListResponseDto,
  EarningsResponseDto,
  StatsResponseDto,
} from './dto/courier.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: Role;
  };
}

@ApiTags('Courier Deliveries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COURIER, Role.ADMIN)
@Controller('couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Get('deliveries')
  @ApiOperation({
    summary: 'Get courier deliveries',
    description:
      'Retrieve all deliveries assigned to the authenticated courier with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PROCESSING',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELAYED',
      'RETURNED',
      'CANCELLED',
    ],
    description: 'Filter by parcel status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['PICKUP', 'DELIVERY'],
    description: 'Filter by pickup or delivery tasks',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by tracking number, description, or location',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter deliveries from this date (ISO string)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter deliveries to this date (ISO string)',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    description: 'Filter by priority level',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliveries retrieved successfully',
    type: DeliveriesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - User does not have courier role',
  })
  async getMyDeliveries(
    @Request() req: AuthenticatedRequest,
    @Query() filters: DeliveryFiltersDto,
  ): Promise<DeliveriesListResponseDto> {
    const deliveries = await this.courierService.getMyDeliveries(
      req.user.userId,
      filters,
    );

    return {
      success: true,
      message: 'Deliveries retrieved successfully',
      data: deliveries,
      total: deliveries.length,
    };
  }

  @Get('deliveries/:id')
  @ApiOperation({
    summary: 'Get delivery details',
    description:
      'Retrieve detailed information about a specific delivery assigned to the courier',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery/Parcel ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery details retrieved successfully',
    type: DeliveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delivery not found or not assigned to courier',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getDeliveryById(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) deliveryId: string,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.courierService.getDeliveryById(
      deliveryId,
      req.user.userId,
    );

    return {
      success: true,
      message: 'Delivery details retrieved successfully',
      data: delivery,
    };
  }

  @Put('deliveries/:id/status')
  @UseInterceptors(FileInterceptor('deliveryPhoto'))
  @ApiOperation({
    summary: 'Update delivery status',
    description:
      'Update the status of a delivery with optional photo upload for proof of delivery',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery/Parcel ID',
    type: String,
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'PICKED_UP',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'DELAYED',
            'RETURNED',
          ],
          description: 'New status for the delivery',
        },
        location: {
          type: 'string',
          description: 'Location description for status update',
        },
        description: {
          type: 'string',
          description: 'Description of status update',
        },
        courierNotes: {
          type: 'string',
          description: 'Courier notes about the status update',
        },
        latitude: {
          type: 'number',
          description: 'Latitude coordinate of status update',
        },
        longitude: {
          type: 'number',
          description: 'Longitude coordinate of status update',
        },
        deliveryPhoto: {
          type: 'string',
          format: 'binary',
          description: 'Photo proof of delivery (optional)',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery status updated successfully',
    type: DeliveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or missing required data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delivery not found or not assigned to courier',
  })
  async updateDeliveryStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) deliveryId: string,
    @Body() updateData: DeliveryStatusUpdateDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.courierService.updateDeliveryStatus(
      deliveryId,
      req.user.userId,
      { ...updateData, parcelId: deliveryId },
      file,
    );

    return {
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery,
    };
  }

  @Post('deliveries/:id/pickup')
  @ApiOperation({
    summary: 'Mark delivery as picked up',
    description:
      'Convenience endpoint to mark a delivery as picked up with location data',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery/Parcel ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery marked as picked up successfully',
    type: DeliveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delivery not found or not assigned to courier',
  })
  async markAsPickedUp(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) deliveryId: string,
    @Body() pickupData: MarkAsPickedUpDto,
  ): Promise<DeliveryResponseDto> {
    const updateData: DeliveryStatusUpdateDto = {
      status: 'PICKED_UP' as any,
      description: 'Package picked up by courier',
      courierNotes: pickupData.notes,
      latitude: pickupData.latitude,
      longitude: pickupData.longitude,
    };

    const delivery = await this.courierService.updateDeliveryStatus(
      deliveryId,
      req.user.userId,
      { ...updateData, parcelId: deliveryId },
    );

    return {
      success: true,
      message: 'Delivery marked as picked up successfully',
      data: delivery,
    };
  }

  @Post('deliveries/:id/delivered')
  @UseInterceptors(FileInterceptor('deliveryPhoto'))
  @ApiOperation({
    summary: 'Mark delivery as delivered',
    description: 'Mark a delivery as delivered with mandatory photo proof',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery/Parcel ID',
    type: String,
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: {
          type: 'string',
          description: 'Delivery notes',
        },
        latitude: {
          type: 'number',
          description: 'Latitude coordinate of delivery location',
        },
        longitude: {
          type: 'number',
          description: 'Longitude coordinate of delivery location',
        },
        deliveryPhoto: {
          type: 'string',
          format: 'binary',
          description: 'Photo proof of delivery (required)',
        },
      },
      required: ['deliveryPhoto'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery marked as delivered successfully',
    type: DeliveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Photo proof is required for delivery confirmation',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delivery not found or not assigned to courier',
  })
  async markAsDelivered(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) deliveryId: string,
    @Body() deliveryData: MarkAsDeliveredDto,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<DeliveryResponseDto> {
    if (!photo) {
      throw new Error('Photo proof is required for delivery confirmation');
    }

    const updateData: DeliveryStatusUpdateDto = {
      status: 'DELIVERED' as any,
      description: 'Package delivered successfully',
      courierNotes: deliveryData.notes,
      latitude: deliveryData.latitude,
      longitude: deliveryData.longitude,
    };

    const delivery = await this.courierService.updateDeliveryStatus(
      deliveryId,
      req.user.userId,
      { ...updateData, parcelId: deliveryId },
      photo,
    );

    return {
      success: true,
      message: 'Delivery marked as delivered successfully',
      data: delivery,
    };
  }

  @Post('deliveries/:id/failed')
  @ApiOperation({
    summary: 'Mark delivery as failed',
    description:
      'Mark a delivery attempt as failed with reason and reschedule information',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery/Parcel ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery marked as failed successfully',
    type: DeliveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delivery not found or not assigned to courier',
  })
  async markAsFailedDelivery(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) deliveryId: string,
    @Body() failureData: MarkAsFailedDto,
  ): Promise<DeliveryResponseDto> {
    const updateData: DeliveryStatusUpdateDto = {
      status: 'DELAYED' as any,
      description: `Delivery failed: ${failureData.reason}`,
      courierNotes: `${failureData.reason}${failureData.additionalNotes ? `. ${failureData.additionalNotes}` : ''}`,
      latitude: failureData.latitude,
      longitude: failureData.longitude,
    };

    const delivery = await this.courierService.updateDeliveryStatus(
      deliveryId,
      req.user.userId,
        { ...updateData, parcelId: deliveryId },
    );

    return {
      success: true,
      message: 'Delivery marked as failed successfully',
      data: delivery,
    };
  }

  @Get('earnings')
  @ApiOperation({
    summary: 'Get courier earnings',
    description:
      'Retrieve earnings summary including daily, weekly, and monthly breakdowns',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings data retrieved successfully',
    type: EarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getCourierEarnings(
    @Request() req: AuthenticatedRequest,
  ): Promise<EarningsResponseDto> {
    const earnings = await this.courierService.getCourierEarnings(
      req.user.userId,
    );

    return {
      success: true,
      message: 'Earnings data retrieved successfully',
      data: earnings,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get courier statistics',
    description: 'Retrieve overall performance statistics for the courier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courier statistics retrieved successfully',
    type: StatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getCourierStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<StatsResponseDto> {
    const stats = await this.courierService.getCourierStats(req.user.userId);

    return {
      success: true,
      message: 'Courier statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('today-route')
  @ApiOperation({
    summary: "Get today's delivery route",
    description:
      'Retrieve all deliveries scheduled for today in optimized route order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Today's route retrieved successfully",
    type: DeliveriesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getTodayRoute(
    @Request() req: AuthenticatedRequest,
  ): Promise<DeliveriesListResponseDto> {
    const deliveries = await this.courierService.getTodayRoute(req.user.userId);

    return {
      success: true,
      message: "Today's route retrieved successfully",
      data: deliveries,
      total: deliveries.length,
    };
  }

  @Get('active-deliveries')
  @ApiOperation({
    summary: 'Get active deliveries',
    description:
      'Retrieve all currently active deliveries (picked up, in transit, out for delivery)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active deliveries retrieved successfully',
    type: DeliveriesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getActiveDeliveries(
    @Request() req: AuthenticatedRequest,
  ): Promise<DeliveriesListResponseDto> {
    const filters: DeliveryFiltersDto = {
      status: undefined, // Will be handled by service to include active statuses
    };

    const deliveries = await this.courierService.getMyDeliveries(
      req.user.userId,
      {
        ...filters,
        // Override to get active deliveries only
        search: undefined,
      },
    );

    // Filter active deliveries
    const activeDeliveries = deliveries.filter((delivery) =>
      ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(delivery.status),
    );

    return {
      success: true,
      message: 'Active deliveries retrieved successfully',
      data: activeDeliveries,
      total: activeDeliveries.length,
    };
  }

  @Get('pending-pickups')
  @ApiOperation({
    summary: 'Get pending pickups',
    description: 'Retrieve all deliveries pending pickup by the courier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending pickups retrieved successfully',
    type: DeliveriesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getPendingPickups(
    @Request() req: AuthenticatedRequest,
  ): Promise<DeliveriesListResponseDto> {
    const filters: DeliveryFiltersDto = {
      type: 'PICKUP' as any,
    };

    const deliveries = await this.courierService.getMyDeliveries(
      req.user.userId,
      filters,
    );

    return {
      success: true,
      message: 'Pending pickups retrieved successfully',
      data: deliveries,
      total: deliveries.length,
    };
  }
}
