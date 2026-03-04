import { JwtPayload } from '#config/types/auth.types';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AssignPermissionsDto, CreateRoleDto, RoleDto } from './dto/role.dto';
import { RoleService } from './role.service';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'roles', version: '1' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: 'List all roles for the current tenant' })
  @ApiSuccessResponse(RoleDto, 200, 'Returns list of roles.', true)
  @Permissions('ROLES:READ')
  @Get()
  async getRoles(@Req() req: FastifyRequest): Promise<RoleDto[]> {
    const user = req['user'] as JwtPayload;
    return this.roleService.findAllByTenant(user.tenantId!) as any;
  }

  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiSuccessResponse(RoleDto, 201, 'Role created successfully.')
  @Permissions('ROLES:WRITE')
  @Post()
  async createRole(
    @Req() req: FastifyRequest,
    @Body() body: CreateRoleDto,
  ): Promise<RoleDto> {
    const user = req['user'] as JwtPayload;
    return this.roleService.create(user.tenantId!, body.name) as any;
  }

  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiSuccessResponse(RoleDto, 200, 'Permissions assigned successfully.')
  @Permissions('ROLES:WRITE')
  @Post(':role_id/permissions')
  async assignPermissions(
    @Param('role_id') role_id: string,
    @Body() body: AssignPermissionsDto,
  ): Promise<RoleDto> {
    return this.roleService.assignPermissions(
      role_id,
      body.permission_ids,
    ) as any;
  }
}
