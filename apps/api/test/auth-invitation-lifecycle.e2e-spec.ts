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

/**
 * Invitation Lifecycle E2E Test
 * Covers: send invitation → preview → accept → verify membership → decline a second invite
 */
describe('Invitation Lifecycle (e2e)', () => {
  let app: NestFastifyApplication;
  let userRepo: Repository<User>;

  let ownerToken: string;
  let inviteeToken: string;
  let adminRoleId: string;
  let inviteToken: string;
  let declineToken: string;

  const ownerData = { email: 'owner-lifecycle@test.local', password: 'password123', name: 'Owner', companyName: 'Lifecycle Corp' };
  const inviteeData = { email: 'invitee-lifecycle@test.local', password: 'password123', name: 'Invitee' };

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
      await userRepo.delete({ email: ownerData.email });
      await userRepo.delete({ email: inviteeData.email });
    }
    if (app) {
      await app.close();
    }
  });

  it('Owner: register with tenant', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(ownerData)
      .expect(201);

    ownerToken = res.body.data.accessToken;
    expect(ownerToken).toBeDefined();
  });

  it('Invitee: register without tenant (user-only)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register-user')
      .send(inviteeData)
      .expect(201);

    inviteeToken = res.body.data.accessToken;
    expect(inviteeToken).toBeDefined();
  });

  it('Owner: get roles and find the ADMIN role', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/roles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const roles = res.body.data as any[];
    const adminRole = roles.find((r: any) => r.name === 'ADMIN');
    expect(adminRole).toBeDefined();
    adminRoleId = adminRole.role_id;
  });

  it('Owner: send invitation to invitee email', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeData.email, role_id: adminRoleId, expires_in_days: 7 })
      .expect(201);

    expect(res.body.success).toBe(true);
    inviteToken = res.body.data.token;
    expect(inviteToken).toBeDefined();
  });

  it('Anyone: preview invitation by token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/invitations/${inviteToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(inviteeData.email);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.tenant).toBeDefined();
  });

  it('Owner: send a second invite to decline', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeData.email, role_id: adminRoleId })
      .expect(201);

    declineToken = res.body.data.token;
  });

  it('Invitee: decline the second invite', async () => {
    await request(app.getHttpServer())
      .post(`/v1/invitations/${declineToken}/decline`)
      .expect(201);

    // Verify status is DECLINED
    const preview = await request(app.getHttpServer())
      .get(`/v1/invitations/${declineToken}`)
      .expect(400); // expired/declined returns 400

    expect(preview.body.success).toBe(false);
  });

  it('Invitee: accept the first invitation', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/invitations/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('Invitee: after accepting, login resolves correct tenant membership', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: inviteeData.email, password: inviteeData.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    const token = res.body.data.accessToken;

    // /me should show tenantId now
    const meRes = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.data.tenantId).toBeDefined();
  });
});
