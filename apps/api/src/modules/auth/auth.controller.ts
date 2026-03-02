import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// Note: Response used as `any` in decorated params to avoid TS1272
// (isolatedModules + emitDecoratorMetadata). Cast to Response in private helpers.
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { UpdateSSOConfigDto, SSOConfigResponseDto } from './dto/sso-config.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@hrplatform/shared';
interface JwtPayload { userId: string; email: string; companyId: string; role: string; permissions: string[]; }

/**
 * Auth Controller (HTTP Layer)
 * Single Responsibility: Handle HTTP requests/responses only
 * Delegates business logic to AuthService
 */
@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('check-company')
  @ApiOperation({ summary: 'Check if a company name already exists' })
  @ApiQuery({ name: 'name', required: true, description: 'Company name to check' })
  @ApiResponse({ status: 200, description: 'Returns whether the company exists' })
  async checkCompany(@Query('name') name: string) {
    if (!name || name.trim().length < 2) {
      return { exists: false };
    }
    return this.authService.checkCompanyExists(name.trim());
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user and company' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: any): Promise<AuthResponseDto> {
    const authResponse = await this.authService.register(dto);
    this.setAuthCookies(res, authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any): Promise<AuthResponseDto> {
    const authResponse = await this.authService.login(dto);
    this.setAuthCookies(res, authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ): Promise<AuthResponseDto> {
    // Try body first, fall back to httpOnly cookie
    const token = dto.refreshToken || req.cookies?.refresh_token;
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const authResponse = await this.authService.refreshToken(token);
    this.setAuthCookies(res, authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@CurrentUser('userId') userId: string, @Res({ passthrough: true }) res: any): Promise<void> {
    await this.authService.logout(userId);
    this.clearAuthCookies(res);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/v1/auth', // Only sent to auth endpoints
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/v1/auth' });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Update own profile (name, phone)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 204, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'If the email exists, a reset link has been sent' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  // ============================================================================
  // SSO / Google OAuth Endpoints
  // ============================================================================

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth SSO login flow' })
  @ApiQuery({
    name: 'companyId',
    required: true,
    description: 'Company ID to initiate SSO for',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  async googleAuth() {
    // Guard handles the redirect to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback - handles the redirect from Google' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with JWT tokens' })
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    const authResponse = await this.authService.googleLogin(req.user);

    // Redirect to frontend with tokens as query parameters
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const redirectUrl = new URL(`${frontendUrl}/auth/sso/callback`);
    redirectUrl.searchParams.set('accessToken', authResponse.accessToken);
    redirectUrl.searchParams.set('refreshToken', authResponse.refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  @RequireFeature('SSO')
  @Get('sso/config')
  @ApiOperation({ summary: 'Get SSO configuration for the company' })
  @ApiResponse({
    status: 200,
    description: 'SSO configuration retrieved',
    type: SSOConfigResponseDto,
  })
  async getSSOConfig(
    @CurrentUser('companyId') companyId: string,
  ): Promise<SSOConfigResponseDto> {
    return this.authService.getSSOConfig(companyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  @RequireFeature('SSO')
  @Patch('sso/config')
  @ApiOperation({ summary: 'Update SSO configuration for the company' })
  @ApiResponse({
    status: 200,
    description: 'SSO configuration updated',
    type: SSOConfigResponseDto,
  })
  async updateSSOConfig(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateSSOConfigDto,
  ): Promise<SSOConfigResponseDto> {
    return this.authService.updateSSOConfig(companyId, dto);
  }
}
