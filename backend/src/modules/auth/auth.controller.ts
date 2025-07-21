import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { GetUser } from '@common/decorators/get-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserWithoutPassword } from './types/auth.types';
import { RegisterUserDto } from './dto/register-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PrismaService } from '@app/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

interface AuthRequest extends Request {
  user: UserWithoutPassword;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: AuthRequest, @Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    await this.authService.register(dto);

    return { message: 'Check your email to verify your account.' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If a user with that email exists, a password reset email has been sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'Password has been reset successfully.' };
  }

  @Public()
  @Post('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    const user = await this.authService.verifyEmailToken(token);
    return this.authService.login(user); // auto-login after verify
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const rt = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });
    if (!rt || rt.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');
    const { password, ...user } = rt.user;
    const newRt = await this.authService.generateRefreshToken(user.id);
    await this.authService.revokeRefreshToken(rt.token); // single-use rotation
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      refresh_token: newRt,
    };
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto, @GetUser() user) {
    await this.authService.revokeRefreshToken(dto.refreshToken);
    await this.authService.revokeAllRefreshTokens(user.id);
    return { message: 'Logged out' };
  }
}
