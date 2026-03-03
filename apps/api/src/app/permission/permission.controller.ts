import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionService } from './permission.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'permissions', version: '1' })
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOperation({
    summary: 'List all available permissions (UI-friendly with label + group)',
  })
  @Get()
  async findAll() {
    return this.permissionService.findAll();
  }
}
