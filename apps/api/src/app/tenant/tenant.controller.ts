import { JwtPayload } from '#config/types/auth.types';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantService } from './tenant.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @ApiOperation({ summary: 'List all tenants for the current user' })
  @Get()
  async getMyTenants(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getUserMemberships(user.sub);
  }

  @ApiOperation({ summary: 'Get details of a specific tenant' })
  @Get(':id')
  async getTenant(@Param('id') id: string) {
    return this.tenantService.findByDomainOrId(id);
  }

  @ApiOperation({ summary: 'List members of the current active tenant' })
  @Get('members/list')
  async getMembers(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getTenantMembers(user.tenantId!);
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
