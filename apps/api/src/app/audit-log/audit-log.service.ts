import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(tenantId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }
}
