import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, hashPassword } from '@utils/helpers';
import { CreateUserDto } from '@app/modules/users/dto/create-user.dto';
import { EmailService } from '@app/modules/email/email.service';
import { randomBytes, createHash } from 'crypto';
import { UserWithoutPassword, JwtPayload } from './types/auth.types';
import { addDays, addHours } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Validates a user by checking if the email and password match a user in the database.
   * @param email The email of the user.
   * @param pass The password of the user.
   * @returns A promise that resolves to the user without the password if validation is successful, otherwise null.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await comparePassword(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Logs in a user by generating a JWT access token.
   * @param user The user to log in.
   * @returns An object containing the access token and user details.
   */
  login(user: UserWithoutPassword) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      ...user,
    };
  }

  /**
   * Registers a new user and sends a verification email.
   * @param createUserDto The data transfer object containing user details.
   * @returns A promise that resolves to the created user without the password.
   * @throws BadRequestException if a user with the email already exists.
   */
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
        role: createUserDto.role || 'USER',
        isActive: false,
        password: hashedPassword,
      },
    });

    const token = await this.generateEmailVerificationToken(user.id);
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${token}`;


    await this.sendVerificationEmail(user.email, user.name, verificationUrl);

    const { password, ...result } = user;
    return result;
  }

  /**
   * Sends a verification email to the user.
   * @param email The email address of the user.
   * @param name The name of the user.
   * @param verificationUrl The URL for email verification.
   */
  private async sendVerificationEmail(
    email: string,
    name: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.emailService.sendMail(
      email,
      'Welcome to SendIT – Verify Your Email',
      'verify-email',
      {
        name,
        url: verificationUrl,
        helpUrl: 'http://example.com/help',
        supportUrl: 'http://example.com/support',
        securityUrl: 'http://example.com/security',
      },
    );
  }

  /**
   * Initiates the forgot password process by generating a reset token and sending an email.
   * @param email The email of the user who forgot their password.
   * @returns A promise that resolves when the process is complete.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = addHours(new Date(), 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
    await this.sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  /**
   * Sends a password reset email to the user.
   * @param email The email address of the user.
   * @param name The name of the user.
   * @param resetUrl The URL for resetting the password.
   */
  private async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.emailService.sendMail(
      email,
      'Password Reset Request',
      'reset-password',
      {
        name,
        resetUrl,
        helpUrl: 'http://example.com/help',
        supportUrl: 'http://example.com/support',
        securityUrl: 'http://example.com/security',
      },
    );
  }

  /**
   * Resets the password for a user using a reset token.
   * @param token The reset token.
   * @param newPassword The new password.
   * @returns A promise that resolves to the updated user without the password.
   * @throws BadRequestException if the token is invalid or expired.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<UserWithoutPassword> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
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

  /**
   * Generates a refresh token for a user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to the generated refresh token.
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: addDays(new Date(), 7),
      },
    });
    return token;
  }

  /**
   * Revokes a refresh token.
   * @param token The refresh token to revoke.
   * @returns A promise that resolves when the token is revoked.
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  /**
   * Revokes all refresh tokens for a user.
   * @param userId The ID of the user.
   * @returns A promise that resolves when all tokens are revoked.
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Generates an email verification token for a user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to the generated email verification token.
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const plain = randomBytes(32).toString('hex');
    const hashed = createHash('sha256').update(plain).digest('hex');

    await this.prisma.emailVerificationToken.upsert({
      where: { userId },
      update: { token: hashed, expiresAt: addHours(new Date(), 1) },
      create: { userId, token: hashed, expiresAt: addHours(new Date(), 1) },
    });

    return plain;
  }

  /**
   * Verifies an email verification token.
   * @param plain The plain email verification token.
   * @returns A promise that resolves to the user without the password if the token is valid.
   * @throws BadRequestException if the token is invalid or expired.
   */
  async verifyEmailToken(plain: string): Promise<UserWithoutPassword> {
    const hashed = createHash('sha256').update(plain).digest('hex');
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { token: hashed, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isActive: true, welcomeEmailSent: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { id: record.id },
    });

    await this.sendWelcomeEmail(record.user.email, record.user.name);

    const { password, ...user } = record.user;
    return user;
  }

  /**
   * Sends a welcome email to the user.
   * @param email The email address of the user.
   * @param name The name of the user.
   */
  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.emailService.sendMail(email, 'Welcome to SendIT!', 'welcome', {
      name,
      helpUrl: 'http://example.com/help',
      trackingUrl: 'http://example.com/tracking',
      securityUrl: 'http://example.com/security',
      dashboardUrl: 'http://example.com/dashboard',
      supportUrl: 'http://example.com/support',
    });
  }
}
