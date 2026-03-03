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
 * RBAC Enforcement E2E Test
 * Verifies that role-based permissions control access to resources,
 * and that dynamically revoking role permissions takes immediate effect.
 */
describe('RBAC Enforcement (e2e)', () => {
  let app: NestFastifyApplication;
  let userRepo: Repository<User>;

  let ownerToken: string;
  let memberToken: string;
  let adminRoleId: string;
  let memberInviteToken: string;
  let protectedProductId: string;

  const ownerData = { email: 'owner-rbac@test.local', password: 'password123', name: 'Owner', companyName: 'RBAC Corp' };
  const memberData = { email: 'member-rbac@test.local', password: 'password123', name: 'Member' };

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

    // 1. Register Owner
    const resOwner = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(ownerData);
    ownerToken = resOwner.body.data.accessToken;

    // 2. Register Member (no tenant)
    const resMember = await request(app.getHttpServer())
      .post('/v1/auth/register-user')
      .send(memberData);
    memberToken = resMember.body.data.accessToken;

    // 3. Get ADMIN role
    const resRoles = await request(app.getHttpServer())
      .get('/v1/roles')
      .set('Authorization', `Bearer ${ownerToken}`);
    const roles = resRoles.body.data as any[];
    const adminRole = roles.find((r: any) => r.name === 'ADMIN');
    adminRoleId = adminRole.role_id;

    // 4. Invite member with ADMIN role
    const invRes = await request(app.getHttpServer())
      .post('/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberData.email, role_id: adminRoleId });
    memberInviteToken = invRes.body.data.token;

    // 5. Member accepts invite
    await request(app.getHttpServer())
      .post(`/v1/invitations/${memberInviteToken}/accept`)
      .set('Authorization', `Bearer ${memberToken}`);

    // 6. Member re-logins to get tenant-scoped JWT
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: memberData.email, password: memberData.password });
    memberToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (userRepo) {
      await userRepo.delete({ email: ownerData.email });
      await userRepo.delete({ email: memberData.email });
    }
    if (app) {
      await app.close();
    }
  });

  it('Member with ADMIN role: should be able to read products', async () => {
    await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
  });

  it('Member with ADMIN role: should be able to write products', async () => {
    await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'RBAC Product', price: 50 })
      .expect(201);
  });

  it('Owner: creates a protected product before role revocation', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Protected Product', price: 80 })
      .expect(201);

    protectedProductId = res.body.data.product_id;
    expect(protectedProductId).toBeDefined();
  });

  it('Owner: revoke ALL permissions from ADMIN role', async () => {
    await request(app.getHttpServer())
      .post(`/v1/roles/${adminRoleId}/permissions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ permission_ids: [] })
      .expect(201);
  });

  it('Member: after revocation, should be denied access (403)', async () => {
    await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('Member: after revocation, write should also be denied (403)', async () => {
    await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Sneaky Product', price: 1 })
      .expect(403);
  });

  it("Member without ADMIN role: cannot delete product within same tenant (403)", async () => {
    await request(app.getHttpServer())
      .delete(`/v1/products/${protectedProductId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
