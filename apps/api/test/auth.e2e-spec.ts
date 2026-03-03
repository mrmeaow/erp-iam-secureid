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
import { User } from './../src/app/user/entities/user.entity';
import { truncateTables } from './utils';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let userRepo: Repository<User>;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: 'auth-e2e@test.local',
    password: 'password123',
    name: 'Auth E2E User',
    companyName: 'Auth E2E Corp',
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

    userRepo = moduleFixture.get(getRepositoryToken(User));
    const permissionService = moduleFixture.get(PermissionService);
    const dataSource = moduleFixture.get(DataSource);
    await truncateTables(dataSource);
    await permissionService.seedDefaults();
  });

  afterAll(async () => {
    if (userRepo) {
      await userRepo.delete({ email: testUser.email });
    }
    if (app) {
      await app.close();
    }
  });

  it('/v1/auth/register (POST) - Success with tenant', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('/v1/auth/register (POST) - Conflict on duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('/v1/auth/login (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('/v1/auth/login (POST) - Wrong password → 401', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);
  });

  it('/v1/auth/me (GET) - Success with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email', testUser.email);
    expect(res.body.data).toHaveProperty('tenantId');
  });

  it('/v1/auth/me (GET) - 401 without token', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });

  it('/v1/auth/refresh (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('/v1/auth/logout (POST) - Success', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('/v1/auth/me (GET) - 401 after logout (revoked session)', async () => {
    await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
