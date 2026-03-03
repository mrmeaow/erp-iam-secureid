import { JwtPayload } from '#config/types/auth.types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { ProductService } from './product.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'List all products in current tenant' })
  @Permissions('PRODUCTS:READ')
  @Get()
  async findAll(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.productService.findAll(user.tenantId!);
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @Permissions('PRODUCTS:READ')
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.productService.findOne(id, user.tenantId!);
  }

  @ApiOperation({ summary: 'Create a new product' })
  @Permissions('PRODUCTS:WRITE')
  @Post()
  async create(@Body() body: any, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.productService.create(user.tenantId!, user.sub, body);
  }

  @ApiOperation({ summary: 'Update an existing product' })
  @Permissions('PRODUCTS:WRITE')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: FastifyRequest,
  ) {
    const user = req['user'] as JwtPayload;
    return this.productService.update(id, user.tenantId!, body);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @Permissions('PRODUCTS:WRITE')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    return this.productService.remove(id, user.tenantId!);
  }
}
