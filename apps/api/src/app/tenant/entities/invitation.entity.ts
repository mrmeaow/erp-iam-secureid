import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { Tenant } from './tenant.entity';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

@Entity('invitations')
export class Invitation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  invitation_id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ApiProperty()
  @Column({ type: 'uuid' })
  role_id: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  permissions?: any;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @ApiProperty({ enum: InvitationStatus })
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
