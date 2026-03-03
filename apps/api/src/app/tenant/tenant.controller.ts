import { JwtPayload } from '#config/types/auth.types';
import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantService } from './tenant.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'List all tenants for the current user' })
  @ApiResponse({ status: 200, description: 'List of tenant memberships' })
  @Get()
  async getMyTenants(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getUserMemberships(user.sub);
  }

  @ApiOperation({ summary: 'Get details of a specific tenant' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @Get(':id')
  async getTenant(@Param('id') id: string) {
    return this.tenantService.findByDomainOrId(id);
  }

  @ApiOperation({ summary: 'List members of the current active tenant' })
  @ApiResponse({ status: 200, description: 'List of tenant members' })
  @Get('members/list')
  async getMembers(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getTenantMembers(user.tenantId!);
  }

  @ApiOperation({ summary: 'Switch current user active tenant session context' })
  @Post(':tenantId/switch')
  async switchTenant(
    @Param('tenantId') tenantId: string,
    @Req() req: FastifyRequest,
  ) {
    const user = req['user'] as JwtPayload;
    return this.authService.switchTenant(user.sub, user.jti, tenantId);
  }

  @ApiOperation({ summary: 'Add member to current tenant' })
  @Post('members')
  async addMember(
    @Body() body: { user_id: string; role_id: string; permissions?: any },
    @Req() req: FastifyRequest,
  ) {
    const user = req['user'] as JwtPayload;
    return this.tenantService.addMember(
      user.tenantId!,
      body.user_id,
      body.role_id,
      body.permissions,
    );
  }

  @ApiOperation({ summary: 'Remove member from current tenant' })
  @Delete('members/:userId')
  async removeMember(
    @Param('userId') userId: string,
    @Req() req: FastifyRequest,
  ) {
    const user = req['user'] as JwtPayload;
    await this.tenantService.removeMember(user.tenantId!, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Update member permissions (ABAC/ACL overrides)' })
  @Post('members/:userId/permissions')
  async updateMemberPermissions(
    @Param('userId') userId: string,
    @Body() body: { permissions: any },
    @Req() req: FastifyRequest,
  ) {
    const user = req['user'] as JwtPayload;
    const memberships = await this.tenantService.getTenantMembers(user.tenantId!);
    const target = memberships.find((m) => m.user_id === userId);
    if (!target) throw new Error('Member not found');

    return this.tenantService.addMember(
      user.tenantId!,
      userId,
      target.role_id,
      body.permissions,
    );
  }
}
