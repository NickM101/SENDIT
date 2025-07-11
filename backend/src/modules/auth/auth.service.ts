import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, hashPassword } from '@utils/helpers';
import { CreateUserDto } from '@app/modules/users/dto/create-user.dto';
import { EmailService } from '@app/modules/email/email.service';
import { randomBytes, createHash } from 'crypto';
import { UserWithoutPassword, JwtPayload } from './types/auth.types';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await comparePassword(pass, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: UserWithoutPassword) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
      ...user,
    };
  }

  async register(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    const hashedPassword = await hashPassword(createUserDto.password);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // Send welcome email
    await this.emailService.sendMail(
      user.email,
      'Welcome to SendIT!',
      'welcome', // Assuming a 'welcome.ejs' template exists
      { name: user.name },
    );

    const { password: _, ...result } = user;
    return result;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, do not reveal if the user exists or not
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`; // TODO: Make this configurable

    await this.emailService.sendMail(
      user.email,
      'Password Reset Request',
      'reset-password', // Assuming a 'reset-password.ejs' template exists
      { name: user.name, resetUrl },
    );
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<UserWithoutPassword> {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    const { password, ...result } = updatedUser;

    return result; 
  }
}
