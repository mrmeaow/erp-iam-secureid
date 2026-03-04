import { buildSuccess } from '#config/api.response';
import { JwtPayload } from '#config/types/auth.types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PaginationQueryDto } from '../../shared/dto/pagination.dto';
import { SuccessResponseDto } from '../../shared/dto/response.dto';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import {
  CreateProductDto,
  ProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @ApiOperation({ summary: 'List all products in current tenant' })
  @ApiSuccessResponse(ProductDto, 200, 'Returns list of products.', true)
  @Permissions('PRODUCTS:READ')
  @Get()
  async findAll(
    @Req() req: FastifyRequest,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req['user'] as JwtPayload;
    const { data, total } = await this.productService.findAll(
      user.tenantId!,
      query,
    );

    await this.auditLogService.log({
      action: 'product.read_many',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      payload: { count: data.length, total, page: query.page },
    });

    return buildSuccess(data, 'OK', 200, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / (query.limit || 10)),
    });
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiSuccessResponse(ProductDto, 200, 'Returns the product.')
  @Permissions('PRODUCTS:READ')
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ): Promise<ProductDto> {
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
    return data as any;
  }

  @ApiOperation({ summary: 'Create a new product' })
  @ApiSuccessResponse(ProductDto, 201, 'Successfully created product.')
  @Permissions('PRODUCTS:WRITE')
  @Post()
  async create(
    @Body() body: CreateProductDto,
    @Req() req: FastifyRequest,
  ): Promise<ProductDto> {
    const user = req['user'] as JwtPayload;
    const data = await this.productService.create(
      user.tenantId!,
      user.sub,
      body,
    );
    await this.auditLogService.log({
      action: 'product.created',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: 'Product',
      resource_id: data.product_id,
      payload: { name: data.name },
    });
    return data as any;
  }

  @ApiOperation({ summary: 'Update an existing product' })
  @ApiSuccessResponse(ProductDto, 200, 'Successfully updated product.')
  @Permissions('PRODUCTS:WRITE')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: FastifyRequest,
  ): Promise<ProductDto> {
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
    return data as any;
  }

  @ApiOperation({ summary: 'Delete a product' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Successfully deleted product.')
  @Permissions('PRODUCTS:WRITE')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ): Promise<SuccessResponseDto> {
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
    return { success: true, message: 'Product deleted' };
  }
}
