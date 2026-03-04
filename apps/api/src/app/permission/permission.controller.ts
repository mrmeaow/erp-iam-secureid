import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { PermissionDto } from './dto/permission.dto';
import { PermissionService } from './permission.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'permissions', version: '1' })
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOperation({
    summary: 'List all available permissions (UI-friendly with label + group)',
  })
  @ApiSuccessResponse(PermissionDto, 200, 'Returns list of permissions.', true)
  @Permissions('ROLES:READ')
  @Get()
  async findAll(): Promise<PermissionDto[]> {
    return this.permissionService.findAll() as any;
  }
}
