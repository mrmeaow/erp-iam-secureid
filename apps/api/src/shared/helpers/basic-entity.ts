import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BasicModel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;
}

export class ModelWithTimestamps extends BasicModel {
  @CreateDateColumn()
  declare created_at: Date;

  @UpdateDateColumn()
  declare updated_at: Date;
}
