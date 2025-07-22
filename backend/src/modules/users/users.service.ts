import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UploadsService } from '@app/modules/uploads/uploads.service';
import * as bcrypt from 'bcryptjs'; // Changed to bcryptjs
import { User, Prisma } from '@prisma/client'; // Added Prisma
  
type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll(query: UserQueryDto) {
    const { search, page = 1, limit = 10, role, isActive } = query; // Added default values
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } }, // Used Prisma.QueryMode.insensitive
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(Array.isArray(role) &&
        role.filter(Boolean).length > 0 && {
          role: { in: role.filter(Boolean) },
        }),
      ...(isActive !== undefined && { isActive }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Define a type that omits the password field

  async findOne(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const { password, ...userWithoutPassword } = user; // Exclude password from response
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email, deletedAt: null } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new BadRequestException('Email already in use.');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateByAdmin(
    id: string,
    updateUserByAdminDto: UpdateUserByAdminDto,
  ): Promise<User> {
    const existingUser = await this.findOne(id);

    if (
      updateUserByAdminDto.email &&
      updateUserByAdminDto.email !== existingUser.email
    ) {
      const emailExists = await this.findByEmail(updateUserByAdminDto.email);
      if (emailExists) {
        throw new BadRequestException('Email already in use.');
      }
    }

    if (updateUserByAdminDto.password) {
      updateUserByAdminDto.password = await bcrypt.hash(
        updateUserByAdminDto.password,
        10,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserByAdminDto,
    });
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid old password.');
    }

    const newHashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: { id },
      data: { password: newHashedPassword },
    });
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const existingUser = await this.findOne(id);

    if (
      updateProfileDto.email &&
      updateProfileDto.email !== existingUser.email
    ) {
      const emailExists = await this.findByEmail(updateProfileDto.email);
      if (emailExists) {
        throw new BadRequestException('Email already in use.');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async updateProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const imageUrl = await this.uploadsService.uploadImage(file);

    if (!imageUrl) {
      throw new BadRequestException('Invalid file or upload failed.');
    }

    await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: imageUrl },
    });

    return imageUrl;
  }

  async softDelete(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (user.deletedAt) {
      throw new BadRequestException(`User with ID ${id} is already deleted.`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    if (!user.deletedAt) {
      throw new BadRequestException(`User with ID ${id} is not soft-deleted.`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async remove(id: string): Promise<User> {
    // This is a hard delete, typically used for cleanup or by admin with caution
    // Consider using softDelete instead for most cases.
    return this.prisma.user.delete({ where: { id } });
  }

  async getUserStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });
    const inactiveUsers = await this.prisma.user.count({
      where: { isActive: false },
    });
    const adminUsers = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
    };
  }
}
