import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('tenants')
export class Tenant {
  @ApiProperty({ description: 'The unique identifier of the tenant.' })
  @PrimaryGeneratedColumn('uuid')
  tenant_id: string;

  @ApiProperty({ description: 'The name of the tenant.' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'The primary domain associated with the tenant.',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain: string;

  @ApiProperty({
    description: 'The current status of the tenant.',
    enum: TenantStatus,
  })
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
