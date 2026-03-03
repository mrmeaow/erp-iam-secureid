import type { JwtPayload } from '#config/types/auth.types';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuditLogService } from './audit-log.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'List audit logs for current tenant' })
  @Permissions('AUDIT:READ')
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  @Get()
  async findAll(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.auditLogService.findAll(user.tenantId!);
  }
}
