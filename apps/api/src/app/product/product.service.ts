import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(tenant_id: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { tenant_id },
    });
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
