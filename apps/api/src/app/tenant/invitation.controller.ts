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
import { SuccessResponseDto } from '../../shared/dto/response.dto';
import { ApiSuccessResponse } from '../../shared/utils/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { InvitationDto, SendInviteDto } from './dto/invitation.dto';
import { InvitationService } from './services/invitation.service';

@ApiTags('Invitations')
@Controller({ path: 'invitations', version: '1' })
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Send an invitation to join the current tenant' })
  @ApiSuccessResponse(InvitationDto, 201, 'Invitation sent successfully.')
  @Post()
  async sendInvite(
    @Req() req: FastifyRequest,
    @Body() body: SendInviteDto,
  ): Promise<InvitationDto> {
    const user = req['user'] as JwtPayload;
    return this.invitationService.createInvitation({
      ...body,
      tenant_id: user.tenantId as string,
    }) as any;
  }

  @ApiOperation({ summary: 'Preview an invitation before accepting' })
  @ApiSuccessResponse(InvitationDto, 200, 'Invitation details for preview.')
  @Get(':token')
  async previewInvite(@Param('token') token: string): Promise<InvitationDto> {
    return this.invitationService.findByToken(token) as any;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Accept a tenant invitation' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Invitation accepted.')
  @Post(':token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Req() req: FastifyRequest,
  ): Promise<SuccessResponseDto> {
    const user = req['user'] as JwtPayload;
    await this.invitationService.acceptInvitation(token, user.sub);
    return { success: true, message: 'Invitation accepted' };
  }

  @ApiOperation({ summary: 'Decline a tenant invitation' })
  @ApiSuccessResponse(SuccessResponseDto, 200, 'Invitation declined.')
  @Post(':token/decline')
  async declineInvite(
    @Param('token') token: string,
  ): Promise<SuccessResponseDto> {
    await this.invitationService.declineInvitation(token);
    return { success: true, message: 'Invitation declined' };
  }
}
