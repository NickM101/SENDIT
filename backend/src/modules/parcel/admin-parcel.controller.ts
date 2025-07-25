import { GetUser } from "@app/common/decorators/get-user.decorator";
import { Roles } from "@app/common/decorators/roles.decorator";
import { Controller, UseGuards, Put, Param, Body, Get, Query, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ParcelQueryDto } from "./dto/parcel.dto";
import { ParcelService } from "./parcel.service";


// NestJS Admin Parcel Controller
@Controller('admin/parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Admin - Parcels')
export class AdminParcelController {
  constructor(private readonly parcelService: ParcelService) {}

  @Put(':id/assign-courier')
  @ApiOperation({ summary: 'Assign courier to parcel' })
  async assignCourier(
    @Param('id') parcelId: string,
    @Body() dto: { courierId: string },
    @GetUser() admin: any,
  ) {
    const result = await this.parcelService.assignCourier(
      parcelId,
      dto.courierId,
      admin.userId,
    );

    return {
      success: true,
      message: 'Courier assigned successfully',
      data: result,
    };
  }

  @Get('pending-assignment')
  @ApiOperation({ summary: 'Get parcels pending courier assignment' })
  async getPendingParcels(@Query() query: ParcelQueryDto) {
    const result = await this.parcelService.getParcelsForAssignment(query);
    return {
      success: true,
      message: 'Pending parcels retrieved successfully',
      data: result,
    };
  }

  @Get('delivery-points')
  @ApiOperation({ summary: 'Get delivery points' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery points retrieved successfully',
  })
  async getDeliveryPoints(
    @Query('county') county?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.parcelService.getDeliveryPoints({
      county: county as any,
      city,
      isActive: isActive === 'true',
    });

    return {
      success: true,
      message: 'Delivery points retrieved successfully',
      data: result,
    };
  }
}