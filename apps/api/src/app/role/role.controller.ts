import { JwtPayload } from '#config/types/auth.types';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleService } from './role.service';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'roles', version: '1' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: 'List all roles for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  @Get()
  async getRoles(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.roleService.findAllByTenant(user.tenantId!);
  }

  @ApiOperation({ summary: 'Create a new custom role' })
  @Post()
  async createRole(
    @Req() req: FastifyRequest,
    @Body() body: { name: string; description?: string },
  ) {
    const user = req['user'] as JwtPayload;
    return this.roleService.create(user.tenantId!, body.name);
  }

  @ApiOperation({ summary: 'Assign permissions to a role' })
  @Post(':role_id/permissions')
  async assignPermissions(
    @Param('role_id') role_id: string,
    @Body() body: { permission_ids: string[] },
  ) {
    return this.roleService.assignPermissions(role_id, body.permission_ids);
  }
}
