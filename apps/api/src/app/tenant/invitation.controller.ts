import { JwtPayload } from '#config/types/auth.types';
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/guards/auth.guard';
import { InvitationService } from './services/invitation.service';

@ApiTags('Invitations')
@Controller({ path: 'invitations', version: '1' })
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Send an invitation to join the current tenant' })
  @Post()
  async sendInvite(@Req() req: FastifyRequest, @Body() body: any) {
    const user = req['user'] as JwtPayload;
    return this.invitationService.createInvitation({
      ...body,
      tenant_id: user.tenantId,
    });
  }

  @ApiOperation({ summary: 'Preview an invitation before accepting' })
  @Get(':token')
  async previewInvite(@Param('token') token: string) {
    return this.invitationService.findByToken(token);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Accept a tenant invitation' })
  @Post(':token/accept')
  async acceptInvite(@Param('token') token: string, @Req() req: FastifyRequest) {
    const user = req['user'] as JwtPayload;
    await this.invitationService.acceptInvitation(token, user.sub);
    return { success: true };
  }

  @ApiOperation({ summary: 'Decline a tenant invitation' })
  @Post(':token/decline')
  async declineInvite(@Param('token') token: string) {
    await this.invitationService.declineInvitation(token);
    return { success: true };
  }
}
