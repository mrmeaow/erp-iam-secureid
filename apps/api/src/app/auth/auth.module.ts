import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../../shared/modules/app-config/app-config.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { RoleModule } from '../role/role.module';
import { Membership } from '../tenant/entities/membership.entity';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    UserModule,
    TenantModule,
    RoleModule,
    AuditLogModule,
    TypeOrmModule.forFeature([Membership]),

    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        privateKey: config.jwt.privateKey,
        publicKey: config.jwt.publicKey,
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.jwt.accessExpiry as any,
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
