import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { Membership } from '../tenant/entities/membership.entity';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Membership]),
    AuthModule,
    AuditLogModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
