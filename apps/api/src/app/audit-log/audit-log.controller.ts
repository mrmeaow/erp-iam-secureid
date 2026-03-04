import type { JwtPayload } from '#config/types/auth.types';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AuditLogService } from './audit-log.service';
import { AuditLogDto } from './dto/audit-log.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'List audit logs for current tenant' })
  @ApiSuccessResponse(AuditLogDto, 200, 'Returns list of audit logs.', true)
  @Permissions('AUDIT:READ')
  @Get()
  async findAll(@Req() req: FastifyRequest): Promise<AuditLogDto[]> {
    const user = req['user'] as JwtPayload;
    return this.auditLogService.findAll(user.tenantId!) as any;
  }
}
