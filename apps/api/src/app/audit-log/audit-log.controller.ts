import { buildSuccess } from '#config/api.response';
import type { JwtPayload } from '#config/types/auth.types';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PaginationQueryDto } from '../../shared/dto/pagination.dto';
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
  async findAll(
    @Req() req: FastifyRequest,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req['user'] as JwtPayload;
    const { data, total } = await this.auditLogService.findAll(
      user.tenantId!,
      query,
    );

    return buildSuccess(data, 'OK', 200, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / (query.limit || 50)),
    });
  }
}
