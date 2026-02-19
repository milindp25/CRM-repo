import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponseDto } from './dto';
import { UpdateSSOConfigDto, SSOConfigResponseDto } from './dto/sso-config.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
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
  @Post('register')
  @ApiOperation({ summary: 'Register a new user and company' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@CurrentUser('userId') userId: string): Promise<void> {
    await this.authService.logout(userId);
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
