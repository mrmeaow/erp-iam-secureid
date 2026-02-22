import { ModelWithTimestamps } from '#shared/helpers/basic-entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends ModelWithTimestamps {
  @Column('varchar')
  full_name: string;

  // T.B.D
}
