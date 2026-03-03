import { JwtPayload } from '#config/types/auth.types';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SuccessResponseDto } from '../../shared/dto/response.dto';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { AuthService } from './auth.service';
import { AuthTokensDto, UserProfileDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthGuard } from './guards/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiSuccessResponse(
    AuthTokensDto,
    201,
    'Successfully registered and logged in.',
  )
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-user')
  @ApiOperation({ summary: 'Register a new user only (no company/tenant)' })
  @ApiSuccessResponse(
    AuthTokensDto,
    201,
    'Successfully registered user.',
  )
  async registerUser(@Body() registerDto: RegisterUserDto) {
    return this.authService.registerUser(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiSuccessResponse(AuthTokensDto, 200, 'Successfully logged in.')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiSuccessResponse(AuthTokensDto, 200, 'Successfully refreshed tokens.')
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke session' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out.',
    type: SuccessResponseDto,
  })
  async logout(@Req() req: FastifyRequest) {
    const payload = req['user'] as JwtPayload;
    await this.authService.logout(payload.sub, payload.jti);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user details' })
  @ApiSuccessResponse(UserProfileDto, 200, 'Returns the current user payload.')
  async getMe(@Req() req: FastifyRequest) {
    return req['user'] as JwtPayload;
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiSuccessResponse(
    SuccessResponseDto,
    200,
    'Reset link sent if account exists.',
  )
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Password reset successful.')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password while logged in' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Password changed successfully.')
  async changePassword(
    @Req() req: FastifyRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const payload = req['user'] as JwtPayload;
    return this.authService.changePassword(payload.sub, changePasswordDto);
  }

  @Post('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Email verification successful.')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }
}
