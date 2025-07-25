import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PickupPointService } from './pickup-point.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '@app/common/decorators/public.decorator';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PickupPointQueryDto } from './dto/pickup-point-query-dto';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
@ApiTags('Pickup Points')
@Controller('pickup-points')
export class PickupPointController {
  constructor(private readonly pickupPointService: PickupPointService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Pickup Point' })
  @ApiResponse({
    status: 201,
    description: 'Pickup Point created successfully',
  })
  create(@Body() createDto: CreatePickupPointDto) {
    return this.pickupPointService.create(createDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Get a list of Pickup Points with filters, pagination, and sorting',
  })
  findAll(@Query() query: PickupPointQueryDto) {
    return this.pickupPointService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Pickup Point by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pickup Point retrieved successfully',
  })
  findOne(@Param('id') id: string) {
    return this.pickupPointService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a Pickup Point by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pickup Point updated successfully',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdatePickupPointDto) {
    return this.pickupPointService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Pickup Point by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pickup Point deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.pickupPointService.remove(id);
  }
}
