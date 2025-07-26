// src/modules/parcel/controllers/admin-parcel.controller.ts
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { Roles } from '@app/common/decorators/roles.decorator';
import {
  Controller,
  UseGuards,
  Put,
  Param,
  Body,
  Get,
  Query,
  HttpStatus,
  BadRequestException,
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
import { Role, ParcelStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParcelQueryDto } from './dto/parcel.dto';
import { ParcelService } from './parcel.service';
import { IsString, IsOptional } from 'class-validator';


// DTO for Assign Courier request body
export class AssignCourierDto {
  @IsString()
  courierId: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Admin - Parcels')
@Controller('admin/parcels')
export class AdminParcelController {
  constructor(private readonly parcelService: ParcelService) {}

  /**
   * Assign a courier to a specific parcel.
   */
  @Put(':id/assign-courier')
  @ApiOperation({
    summary: 'Assign a courier to a parcel',
    description:
      'Assigns a specific courier (identified by courierId) to a parcel (identified by id). ' +
      'This typically transitions the parcel status to PICKED_UP. Only accessible by Admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier (CUID) of the parcel',
    example: 'clv9j8x5b000008l47p3a2b1c',
  })
  @ApiBody({
    description:
      'Object containing the ID of the courier to assign and optional instructions',
    schema: {
      example: {
        courierId: 'clv9j8x5b000008l47p3a2b1d',
        instructions: 'Handle with extra care',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courier assigned successfully',
    schema: {
      example: {
        success: true,
        message: 'Courier assigned successfully',
        data: {
          /* Updated parcel object */
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid request data or business logic error (e.g., parcel not ready, courier invalid)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parcel or Courier not found',
  })
  async assignCourier(
    @Param('id') parcelId: string,
    @Body() dto: AssignCourierDto,
    @GetUser() admin: any,
  ) {
    try {
      if (!dto.courierId) {
        throw new BadRequestException('Courier ID is required');
      }

      const result = await this.parcelService.assignCourier(
        parcelId,
        dto.courierId,
        admin.userId,
        dto.instructions, // Pass instructions
      );

      return {
        success: true,
        message: 'Courier assigned successfully',
        data: result,
      };
    } catch (error) {
      throw error; // Let service exceptions bubble up
    }
  }

  /**
   * Retrieve a list of parcels that are ready for courier assignment.
   */
  @Get('pending-assignment')
  @ApiOperation({
    summary: 'Get parcels pending courier assignment',
    description:
      'Retrieves a paginated list of parcels that are ready to be assigned to a courier ' +
      '(e.g., status PAYMENT_CONFIRMED or PROCESSING). Supports filtering by status and date range.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by specific parcel status',
    example: 'PAYMENT_CONFIRMED',
    enum: ParcelStatus, // Use enum for better Swagger support
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Filter parcels created on or after this date (ISO 8601 format)',
    example: '2023-10-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Filter parcels created on or before this date (ISO 8601 format)',
    example: '2023-10-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending parcels retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Pending parcels retrieved successfully',
        data: {
          data: [
            /* Array of transformed parcel data */
          ],
          pagination: {
            /* Pagination object */
          },
        },
      },
    },
  })
  async getPendingParcels(@Query() query: ParcelQueryDto) {
    try {
      const result = await this.parcelService.getParcelsForAssignment(query);
      return {
        success: true,
        message: 'Pending parcels retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve pending parcels');
    }
  }
}
