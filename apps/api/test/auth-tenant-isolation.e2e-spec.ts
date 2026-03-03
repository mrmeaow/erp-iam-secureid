import { VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { PermissionService } from './../src/app/permission/permission.service';
import { Tenant } from './../src/app/tenant/entities/tenant.entity';
import { User } from './../src/app/user/entities/user.entity';
import { truncateTables } from './utils';

/**
 * Tenant Isolation E2E Test
 * Verifies that users in different tenants cannot see or modify each other's resources.
 */
describe('Tenant Isolation (e2e)', () => {
  let app: NestFastifyApplication;
  let userRepo: Repository<User>;
  let tenantRepo: Repository<Tenant>;

  let tokenA: string;
  let tokenB: string;
  let productIdA: string;

  const userA = { email: 'usera-isolation@test.local', password: 'password123', name: 'User A', companyName: 'Company Alpha' };
  const userB = { email: 'userb-isolation@test.local', password: 'password123', name: 'User B', companyName: 'Company Beta' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    tenantRepo = moduleFixture.get(getRepositoryToken(Tenant));
    const permissionService = moduleFixture.get(PermissionService);
    const dataSource = moduleFixture.get(DataSource);
    await truncateTables(dataSource);
    await permissionService.seedDefaults();
  });

  afterAll(async () => {
    if (userRepo) {
      await userRepo.delete({ email: userA.email });
      await userRepo.delete({ email: userB.email });
    }
    if (app) {
      await app.close();
    }
  });

  it('should register User A with Tenant A and get a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(userA)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    tokenA = res.body.data.accessToken;
  });

  it('should register User B with Tenant B and get a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(userB)
      .expect(201);

    expect(res.body.success).toBe(true);
    tokenB = res.body.data.accessToken;
  });

  it('User A: should create a product in Tenant A', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Alpha Product', description: 'Owned by Alpha', price: 100 })
      .expect(201);

    expect(res.body.success).toBe(true);
    productIdA = res.body.data.product_id;
    expect(productIdA).toBeDefined();
  });

  it('User B: should NOT be able to see Tenant A product (404)', async () => {
    await request(app.getHttpServer())
      .get(`/v1/products/${productIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('User B: should only see their own tenant products (empty or Beta only)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const products = res.body.data as any[];
    expect(products.every((p: any) => p.name !== 'Alpha Product')).toBe(true);
  });

  it('User B: should NOT be able to update Tenant A product (404)', async () => {
    await request(app.getHttpServer())
      .patch(`/v1/products/${productIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked' })
      .expect(404);
  });
});
