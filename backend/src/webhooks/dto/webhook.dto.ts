import { IsString, IsUrl, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebhookEventType {
  INVOICE_AUTHORIZED = 'invoice.authorized',
  INVOICE_REJECTED = 'invoice.rejected',
  INVOICE_CANCELED = 'invoice.canceled',
  MDFE_AUTHORIZED = 'mdfe.authorized',
  MDFE_CLOSED = 'mdfe.closed',
  CERTIFICATE_EXPIRING = 'certificate.expiring',
}

export class WebhookConfigDto {
  @ApiPropertyOptional({
    description: 'URL para receber os webhooks',
    example: 'https://api.suaempresa.com/webhooks',
  })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Eventos que deseja receber',
    enum: WebhookEventType,
    isArray: true,
    example: ['invoice.authorized', 'invoice.rejected'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[];
}

export class WebhookEventDto {
  @ApiProperty({ description: 'ID único do evento' })
  id: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: WebhookEventType,
    example: 'invoice.authorized',
  })
  type: WebhookEventType;

  @ApiProperty({
    description: 'Timestamp do evento (ISO8601)',
    example: '2026-02-05T00:00:00Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Dados do evento' })
  data: Record<string, any>;
}

export class WebhookDeliveryLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventType: string;

  @ApiProperty()
  status: 'pending' | 'success' | 'failed';

  @ApiProperty()
  attempts: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  deliveredAt?: Date;

  @ApiPropertyOptional()
  lastError?: string;
}
