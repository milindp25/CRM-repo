import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@hrplatform/shared';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AddonService } from './addon.service.js';
import { CreateAddonDto, UpdateAddonDto, AssignAddonDto } from './dto/index.js';

@ApiTags('Add-ons')
@ApiBearerAuth()
@Controller({ path: 'addons', version: '1' })
@Roles(UserRole.SUPER_ADMIN)
export class AddonController {
  constructor(private readonly addonService: AddonService) {}

  // ── Feature Add-on CRUD ────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all feature add-ons' })
  async listAddons() {
    return this.addonService.listAddons();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get add-on details' })
  async getAddon(@Param('id') id: string) {
    return this.addonService.getAddon(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature add-on' })
  async createAddon(@Body() dto: CreateAddonDto) {
    return this.addonService.createAddon(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature add-on' })
  async updateAddon(@Param('id') id: string, @Body() dto: UpdateAddonDto) {
    return this.addonService.updateAddon(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a feature add-on' })
  async deactivateAddon(@Param('id') id: string) {
    return this.addonService.deactivateAddon(id);
  }

  // ── Company Add-on Assignment ──────────────────────────────────────

  @Get('companies/:companyId')
  @ApiOperation({ summary: 'List add-ons for a company' })
  async getCompanyAddons(@Param('companyId') companyId: string) {
    return this.addonService.getCompanyAddons(companyId);
  }

  @Post('companies/:companyId')
  @ApiOperation({ summary: 'Activate an add-on for a company' })
  async activateAddonForCompany(
    @Param('companyId') companyId: string,
    @Body() dto: AssignAddonDto,
  ) {
    return this.addonService.activateAddonForCompany(
      companyId,
      dto.featureAddonId,
      dto.expiresAt,
    );
  }

  @Delete('companies/:companyId/:addonId')
  @ApiOperation({ summary: 'Deactivate an add-on for a company' })
  async deactivateAddonForCompany(
    @Param('companyId') companyId: string,
    @Param('addonId') addonId: string,
  ) {
    return this.addonService.deactivateAddonForCompany(companyId, addonId);
  }
}
