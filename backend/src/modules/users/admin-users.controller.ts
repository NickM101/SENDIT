// src/modules/users/admin-users.controller.ts

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Admin Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users/admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: `Get all users (Admin only)` })
  @ApiQuery({
    name: 'search',
    required: false,
    description: `Search by email, name, or phone`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `List of users retrieved successfully.`,
  })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: `Get user statistics (Admin only)` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User statistics retrieved successfully.`,
  })
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @ApiOperation({ summary: `Get a user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to retrieve` })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: `Update a user's information by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to update` })
  update(@Param('id') id: string, @Body() dto: UpdateUserByAdminDto) {
    return this.usersService.updateByAdmin(id, dto);
  }

  @Delete('soft-delete/:id')
  @ApiOperation({ summary: `Soft delete a user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to soft delete` })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Patch('restore/:id')
  @ApiOperation({ summary: `Restore a soft-deleted user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to restore` })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: `Hard delete a user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to hard delete` })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
