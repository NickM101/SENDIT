// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { Public } from '@app/common/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto);
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
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Patch('profile-picture')
  @ApiOperation({ summary: `Upload or update current user's profile picture` })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
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
  updateProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateProfilePicture(req.user.userId, file);
  }

  @Patch(':id')
  @ApiOperation({
    summary: `Update a user's information by ID (limited fields for non-admin)`,
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }
}
