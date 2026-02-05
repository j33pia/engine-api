import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { WebhookConfigDto, WebhookDeliveryLogDto } from './dto/webhook.dto';

@ApiTags('🔔 Webhooks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Obter configuração de webhooks',
    description:
      'Retorna a URL configurada, eventos assinados e secret mascarado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuração atual',
    schema: {
      example: {
        webhookUrl: 'https://api.empresa.com/webhooks',
        webhookSecret: 'whsec_ab...xy',
        events: ['invoice.authorized', 'invoice.rejected'],
      },
    },
  })
  async getConfig(@Request() req: any) {
    return this.webhooksService.getConfig(req.user.partnerId);
  }

  @Patch('config')
  @ApiOperation({
    summary: 'Atualizar configuração de webhooks',
    description: 'Configura a URL de destino e os eventos que deseja receber.',
  })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  async updateConfig(@Request() req: any, @Body() config: WebhookConfigDto) {
    return this.webhooksService.updateConfig(req.user.partnerId, config);
  }

  @Post('test')
  @ApiOperation({
    summary: 'Enviar webhook de teste',
    description:
      'Envia um evento de teste para a URL configurada para validar a integração.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado do teste',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        body: 'OK',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Webhook URL não configurada' })
  async sendTest(@Request() req: any) {
    try {
      return await this.webhooksService.sendTest(req.user.partnerId);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Histórico de entregas',
    description: 'Lista os últimos webhooks enviados com status de entrega.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de registros (padrão: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de entregas',
    type: [WebhookDeliveryLogDto],
  })
  async getLogs(@Request() req: any, @Query('limit') limit?: number) {
    return this.webhooksService.getLogs(req.user.partnerId, limit || 50);
  }

  @Post('secret/regenerate')
  @ApiOperation({
    summary: 'Regenerar webhook secret',
    description:
      'Gera um novo secret para assinatura HMAC. O secret anterior será invalidado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Novo secret gerado',
    schema: {
      example: {
        webhookSecret: 'whsec_new...xyz',
      },
    },
  })
  async regenerateSecret(@Request() req: any) {
    return this.webhooksService.regenerateSecret(req.user.partnerId);
  }
}
