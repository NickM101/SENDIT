import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { Public } from '@app/common/decorators/public.decorator';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiBearerAuth('access-token')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: `Create a new user account` })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: `User created successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid input.`,
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @ApiOperation({ summary: `Get current user's profile` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User profile retrieved successfully.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('change-password')
  @ApiOperation({ summary: `Change current user's password` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Password changed successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid old password or input.`,
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.userId, changePasswordDto);
    return { message: `Password changed successfully.` };
  }

  @Patch('profile')
  @ApiOperation({ summary: `Update current user's profile information` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Profile updated successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid input or email already in use.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Patch('profile-picture')
  @ApiOperation({ summary: `Upload or update current user's profile picture` })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Profile picture updated successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid file or user not found.`,
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = await this.usersService.updateProfilePicture(
      req.user.userId,
      file,
    );
    return { imageUrl };
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin')
  @ApiOperation({ summary: `Get all users (Admin only)` })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: `Search by email, name, or phone`,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: `Page number`,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Items per page`,
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: `Filter by user role`,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: `Filter by active status`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `List of users retrieved successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/:id')
  @ApiOperation({ summary: `Get a user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to retrieve` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User retrieved successfully.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  findOneAdmin(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('admin/:id')
  @ApiOperation({ summary: `Update a user's information by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to update` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User updated successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid input or email already in use.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  updateByAdmin(
    @Param('id') id: string,
    @Body() updateUserByAdminDto: UpdateUserByAdminDto,
  ) {
    return this.usersService.updateByAdmin(id, updateUserByAdminDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete('admin/soft-delete/:id')
  @ApiOperation({ summary: `Soft delete a user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to soft delete` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User soft deleted successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `User already soft-deleted.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('admin/restore/:id')
  @ApiOperation({ summary: `Restore a soft-deleted user by ID (Admin only)` })
  @ApiParam({ name: 'id', description: `ID of the user to restore` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User restored successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `User not soft-deleted.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: `Update a user's information by ID (limited fields for non-admin)`,
  })
  @ApiParam({ name: 'id', description: `ID of the user to update` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User updated successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Invalid input or email already in use.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: `Hard delete a user by ID (Admin only, use with caution)`,
  })
  @ApiParam({ name: 'id', description: `ID of the user to hard delete` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User hard deleted successfully.`,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: `User not found.` })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/stats')
  @ApiOperation({ summary: `Get user statistics (Admin only)` })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `User statistics retrieved successfully.`,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: `Forbidden resource.`,
  })
  getUserStats() {
    return this.usersService.getUserStats();
  }
}
