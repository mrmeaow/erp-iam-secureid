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
import { AuditLogService } from '../audit-log/audit-log.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ProductService } from './product.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @ApiOperation({ summary: 'List all products in current tenant' })
  @Permissions('PRODUCTS:READ')
  @Get()
  async findAll(@Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    const data = await this.productService.findAll(user.tenantId!);
    await this.auditLogService.log({
      action: 'product.read_many',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      payload: { count: data.length },
    });
    return data;
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @Permissions('PRODUCTS:READ')
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    const data = await this.productService.findOne(id, user.tenantId!);
    await this.auditLogService.log({
      action: 'product.read_one',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      resource_id: id,
    });
    return data;
  }

  @ApiOperation({ summary: 'Create a new product' })
  @Permissions('PRODUCTS:WRITE')
  @Post()
  async create(@Body() body: any, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    const data = await this.productService.create(user.tenantId!, user.sub, body);
    await this.auditLogService.log({
      action: 'product.created',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      resource_id: data.product_id,
      payload: { name: data.name },
    });
    return data;
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
    const data = await this.productService.update(id, user.tenantId!, body);
    await this.auditLogService.log({
      action: 'product.updated',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      resource_id: id,
      payload: { keys: Object.keys(body || {}) },
    });
    return data;
  }

  @ApiOperation({ summary: 'Delete a product' })
  @Permissions('PRODUCTS:WRITE')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    await this.productService.remove(id, user.tenantId!);
    await this.auditLogService.log({
      action: 'product.deleted',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      resource_id: id,
    });
    return { success: true };
  }
}
