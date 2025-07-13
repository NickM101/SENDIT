import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelStatusDto } from './dto/update-parcel-status.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '@common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post()
  async create(@Body() createParcelDto: CreateParcelDto, @Req() req) {
    return this.parcelsService.createParcel(createParcelDto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER, Role.PREMIUM_USER)
  async findAll(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('trackingNumber') trackingNumber?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = { status, trackingNumber, dateFrom, dateTo };
    return this.parcelsService.findAllParcels(
      req.user.userId,
      req.user.roles,
      +page,
      +limit,
      filters,
    );
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateParcelStatusDto: UpdateParcelStatusDto,
    @Req() req,
  ) {
    const { status, location, description } = updateParcelStatusDto;
    return this.parcelsService.updateParcelStatus(
      id,
      status,
      req.user.userId,
      location,
      description,
    );
  }

  @Public()
  @Get('/track/:trackingNumber')
  async track(@Param('trackingNumber') trackingNumber: string) {
    return this.parcelsService.trackParcel(trackingNumber);
  }
}