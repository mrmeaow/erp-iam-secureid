import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../shared/dto/pagination.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(
    tenant_id: string,
    query: PaginationQueryDto,
  ): Promise<{ data: Product[]; total: number }> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC', search } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id };
    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder;
    } else {
      order.created_at = 'DESC'; // default sort
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findOne(product_id: string, tenant_id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id, tenant_id },
    });
    if (!product) {
      throw new NotFoundException('Product not found or access denied');
    }
    return product;
  }

  async create(
    tenant_id: string,
    owner_id: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const product = this.productRepository.create({
      ...data,
      tenant_id,
      owner_id,
    });
    return this.productRepository.save(product);
  }

  async update(
    product_id: string,
    tenant_id: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const product = await this.findOne(product_id, tenant_id);
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async remove(product_id: string, tenant_id: string): Promise<void> {
    const product = await this.findOne(product_id, tenant_id);
    await this.productRepository.remove(product);
  }
}
