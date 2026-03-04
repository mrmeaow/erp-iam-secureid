import { JwtPayload } from '#config/types/auth.types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SuccessResponseDto } from '../../shared/dto/response.dto';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { AuthService } from '../auth/auth.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AddMemberDto, TenantDto, TenantMembershipDto } from './dto/tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'List all tenants for the current user' })
  @ApiSuccessResponse(
    TenantMembershipDto,
    200,
    'Returns list of tenant memberships.',
    true,
  )
  @Get()
  async getMyTenants(
    @Req() req: FastifyRequest,
  ): Promise<TenantMembershipDto[]> {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getUserMemberships(user.sub) as any;
  }

  @ApiOperation({ summary: 'Get details of a specific tenant' })
  @ApiSuccessResponse(TenantDto, 200, 'Returns tenant details.')
  @Permissions('TENANTS:READ')
  @Get(':id')
  async getTenant(@Param('id') id: string): Promise<TenantDto> {
    return this.tenantService.findByDomainOrId(id) as any;
  }

  @ApiOperation({ summary: 'List members of the current active tenant' })
  @ApiSuccessResponse(
    TenantMembershipDto,
    200,
    'Returns list of tenant members.',
    true,
  )
  @Permissions('TENANTS:READ')
  @Get('members/list')
  async getMembers(@Req() req: FastifyRequest): Promise<TenantMembershipDto[]> {
    const user = req['user'] as JwtPayload;
    return this.tenantService.getTenantMembers(user.tenantId!) as any;
  }

  @ApiOperation({
    summary: 'Switch current user active tenant session context',
  })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Tenant switched successfully.')
  @Post(':tenantId/switch')
  async switchTenant(
    @Param('tenantId') tenantId: string,
    @Req() req: FastifyRequest,
  ): Promise<SuccessResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.authService.switchTenant(user.sub, user.jti, tenantId) as any;
  }

  @ApiOperation({ summary: 'Add member to current tenant' })
  @ApiSuccessResponse(TenantMembershipDto, 201, 'Member added successfully.')
  @Permissions('TENANTS:WRITE')
  @Post('members')
  async addMember(
    @Body() body: AddMemberDto,
    @Req() req: FastifyRequest,
  ): Promise<TenantMembershipDto> {
    const user = req['user'] as JwtPayload;
    return this.tenantService.addMember(
      user.tenantId!,
      body.user_id,
      body.role_id,
      body.permissions,
    ) as any;
  }

  @ApiOperation({ summary: 'Remove member from current tenant' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Member removed successfully.')
  @Permissions('TENANTS:WRITE')
  @Delete('members/:userId')
  async removeMember(
    @Param('userId') userId: string,
    @Req() req: FastifyRequest,
  ): Promise<SuccessResponseDto> {
    const user = req['user'] as JwtPayload;
    await this.tenantService.removeMember(user.tenantId!, userId);
    return { success: true, message: 'Member removed' };
  }

  @ApiOperation({ summary: 'Update member permissions (ABAC/ACL overrides)' })
  @ApiSuccessResponse(TenantMembershipDto, 200, 'Member permissions updated.')
  @Permissions('TENANTS:WRITE')
  @Post('members/:userId/permissions')
  async updateMemberPermissions(
    @Param('userId') userId: string,
    @Body() body: { permissions: any },
    @Req() req: FastifyRequest,
  ): Promise<TenantMembershipDto> {
    const user = req['user'] as JwtPayload;
    const memberships = await this.tenantService.getTenantMembers(
      user.tenantId!,
    );
    const target = memberships.find((m) => m.user_id === userId);
    if (!target) throw new Error('Member not found');

    return this.tenantService.addMember(
      user.tenantId!,
      userId,
      target.role_id,
      body.permissions,
    ) as any;
  }
}
