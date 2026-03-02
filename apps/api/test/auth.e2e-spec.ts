import { INestApplication, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Tenant } from './../src/app/tenant/entities/tenant.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let tenantRepository: Repository<Tenant>;
  let accessToken: string;
  let refreshToken: string;

  const testTenant = {
    name: 'Test Tenant',
    domain: 'test-tenant',
  };

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    tenant: 'test-tenant',
  };

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

    tenantRepository = moduleFixture.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );

    // Cleanup and seed tenant
    await tenantRepository.delete({ domain: 'test-tenant' });
    await tenantRepository.save(tenantRepository.create(testTenant));
  });

  afterAll(async () => {
    // Cleanup
    await tenantRepository.delete({ domain: 'test-tenant' });
    await app.close();
  });

  it('/v1/auth/register (POST) - Success', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(testUser)
      .expect(201)
      .then((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
      });
  });

  it('/v1/auth/login (POST) - Success', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        tenant: testUser.tenant,
      })
      .expect(200) // @HttpCode(200) in Controller
      .then((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
      });
  });

  it('/v1/auth/me (GET) - Success', () => {
    return request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('email', testUser.email);
        expect(res.body.data).toHaveProperty('tenantId');
      });
  });

  it('/v1/auth/refresh (POST) - Success', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200) // @HttpCode(200) in Controller
      .then((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
      });
  });

  it('/v1/auth/logout (POST) - Success', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200); // @HttpCode(200) in Controller
  });

  it('/v1/auth/me (GET) - Unauthorized after logout', () => {
    return request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
