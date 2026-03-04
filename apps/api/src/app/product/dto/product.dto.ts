import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({ description: 'The unique identifier for the product' })
  product_id: string;

  @ApiProperty({ description: 'The name of the product' })
  name: string;

  @ApiProperty({
    description: 'The stock keeping unit identifier',
    required: false,
  })
  sku?: string;

  @ApiProperty({ description: 'The price of the product' })
  price: number;

  @ApiProperty({ description: 'The tenant ID this product belongs to' })
  tenant_id: string;

  @ApiProperty({ description: 'The user ID who created the product' })
  owner_id: string;

  @ApiProperty({ description: 'When the product was created' })
  created_at: string;

  @ApiProperty({ description: 'When the product was last updated' })
  updated_at: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'The name of the product' })
  name: string;

  @ApiProperty({
    description: 'The stock keeping unit identifier',
    required: false,
  })
  sku?: string;

  @ApiProperty({ description: 'The price of the product' })
  price: number;
}

export class UpdateProductDto {
  @ApiProperty({ description: 'The name of the product', required: false })
  name?: string;

  @ApiProperty({
    description: 'The stock keeping unit identifier',
    required: false,
  })
  sku?: string;

  @ApiProperty({ description: 'The price of the product', required: false })
  price?: number;
}
