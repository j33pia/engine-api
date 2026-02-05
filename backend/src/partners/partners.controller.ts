import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('👥 Partners')
@ApiBearerAuth('JWT-auth')
@Controller('partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Obter perfil do parceiro',
    description: 'Retorna dados do parceiro autenticado',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  getProfile(@Request() req: any) {
    return this.partnersService.getProfile(req.user.partnerId);
  }

  @Post('api-key/regenerate')
  @ApiOperation({
    summary: 'Regenerar API Key',
    description: 'Gera uma nova API Key, invalidando a anterior',
  })
  @ApiResponse({ status: 200, description: 'Nova API Key gerada' })
  regenerateApiKey(@Request() req: any) {
    return this.partnersService.regenerateApiKey(req.user.partnerId);
  }

  @Patch('webhook')
  @ApiOperation({
    summary: 'Atualizar Webhook URL',
    description: 'Configura URL para receber notificações de eventos',
  })
  @ApiResponse({ status: 200, description: 'Webhook atualizado' })
  updateWebhook(@Request() req: any, @Body('webhookUrl') webhookUrl: string) {
    return this.partnersService.updateWebhook(req.user.partnerId, webhookUrl);
  }
}
