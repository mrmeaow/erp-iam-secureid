import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Keep nullable for backward compatibility with pre-migration rows.
  // New writes should always set this field.
  @Column({ nullable: true })
  action: string;

  @Column({ name: 'actor_id', nullable: true })
  actor_id: string;

  @Column({ name: 'actor_email', nullable: true })
  actor_email: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenant_id: string;

  @Column({ name: 'resource_type', nullable: true })
  resource_type: string;

  @Column({ name: 'resource_id', nullable: true })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column({ name: 'ip_address', nullable: true })
  ip_address: string;

  @Column({ name: 'user_agent', nullable: true })
  user_agent: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
