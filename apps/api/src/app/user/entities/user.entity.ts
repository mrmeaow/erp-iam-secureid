import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Unique(['email'])
export class User {
  @ApiProperty({ description: 'The unique identifier of the user.' })
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @ApiProperty({ description: 'The email address of the user.' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({ description: 'The full name of the user.', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  hashed_password?: string;

  @ApiProperty({ description: 'Indicates if the user account is active.' })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiProperty({ description: 'Indicates if the email has been verified.' })
  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 100, nullable: true })
  verification_token?: string;

  @Exclude()
  @Column({ type: 'varchar', length: 100, nullable: true })
  reset_token?: string;

  @ApiProperty({ description: 'The expiration date of the reset token.' })
  @Column({ type: 'timestamp', nullable: true })
  reset_expires_at?: Date;

  @ApiProperty({ description: 'The last login timestamp.' })
  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
