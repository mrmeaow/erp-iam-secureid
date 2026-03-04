import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../shared/dto/pagination.dto';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    const logEntry = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(logEntry);
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const { page = 1, limit = 50, sortBy, sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder;
    } else {
      order.created_at = 'DESC';
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { tenant_id: tenantId },
      order,
      skip,
      take: limit,
    });

    return { data, total };
  }
}
