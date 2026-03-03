import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class Permission {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  permission_id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  resource: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  action: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  group?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
