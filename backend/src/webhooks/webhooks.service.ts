import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WebhookEventDto,
  WebhookEventType,
  WebhookConfigDto,
} from './dto/webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  // Retry delays in milliseconds
  private readonly RETRY_DELAYS = [
    0, // Immediate
    5 * 60000, // 5 min
    30 * 60000, // 30 min
    2 * 3600000, // 2 hours
    24 * 3600000, // 24 hours
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Get webhook configuration for a partner
   */
  async getConfig(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        webhookUrl: true,
        webhookSecret: true,
        webhookEvents: true,
      },
    });

    return {
      webhookUrl: partner?.webhookUrl || null,
      webhookSecret: partner?.webhookSecret
        ? this.maskSecret(partner.webhookSecret)
        : null,
      events: partner?.webhookEvents || [],
    };
  }

  /**
   * Update webhook configuration
   */
  async updateConfig(partnerId: string, config: WebhookConfigDto) {
    const updateData: any = {};

    if (config.webhookUrl !== undefined) {
      updateData.webhookUrl = config.webhookUrl;
    }

    if (config.events !== undefined) {
      updateData.webhookEvents = config.events;
    }

    // Generate secret if URL is being set and no secret exists
    if (config.webhookUrl) {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        select: { webhookSecret: true },
      });

      if (!partner?.webhookSecret) {
        updateData.webhookSecret = this.generateSecret();
      }
    }

    const updated = await this.prisma.partner.update({
      where: { id: partnerId },
      data: updateData,
      select: {
        webhookUrl: true,
        webhookSecret: true,
        webhookEvents: true,
      },
    });

    return {
      webhookUrl: updated.webhookUrl,
      webhookSecret: updated.webhookSecret
        ? this.maskSecret(updated.webhookSecret)
        : null,
      events: updated.webhookEvents,
    };
  }

  /**
   * Dispatch a webhook event to a partner
   */
  async dispatchEvent(
    partnerId: string,
    eventType: WebhookEventType,
    data: Record<string, any>,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        webhookUrl: true,
        webhookSecret: true,
        webhookEvents: true,
      },
    });

    // Check if partner has webhook configured and event is subscribed
    if (!partner?.webhookUrl) {
      this.logger.debug(`Partner ${partnerId} has no webhook URL configured`);
      return null;
    }

    const subscribedEvents = (partner.webhookEvents as string[]) || [];
    if (!subscribedEvents.includes(eventType)) {
      this.logger.debug(`Partner ${partnerId} not subscribed to ${eventType}`);
      return null;
    }

    // Create event payload
    const event: WebhookEventDto = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        partnerId,
        eventType,
        payload: event as any,
        status: 'pending',
        attempts: 0,
      },
    });

    // Attempt delivery
    await this.attemptDelivery(
      delivery.id,
      partner.webhookUrl,
      partner.webhookSecret!,
      event,
    );

    return delivery;
  }

  /**
   * Attempt to deliver a webhook
   */
  private async attemptDelivery(
    deliveryId: string,
    webhookUrl: string,
    secret: string,
    payload: WebhookEventDto,
  ) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status === 'success') {
      return;
    }

    const attempt = delivery.attempts + 1;
    const signature = this.signPayload(payload, secret);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': payload.type,
          'X-Webhook-Delivery': deliveryId,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (response.ok) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'success',
            attempts: attempt,
            deliveredAt: new Date(),
          },
        });
        this.logger.log(
          `Webhook delivered: ${deliveryId} (attempt ${attempt})`,
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error: any) {
      this.logger.warn(
        `Webhook delivery failed: ${deliveryId} (attempt ${attempt}): ${error.message}`,
      );

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: attempt,
          lastError: error.message?.substring(0, 500),
          status: attempt >= 5 ? 'failed' : 'pending',
        },
      });

      // Schedule retry if not exhausted
      if (attempt < 5) {
        const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[4];
        setTimeout(() => {
          this.attemptDelivery(deliveryId, webhookUrl, secret, payload);
        }, delay);
      }
    }
  }

  /**
   * Send a test webhook event
   */
  async sendTest(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    if (!partner?.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const testEvent: WebhookEventDto = {
      id: crypto.randomUUID(),
      type: WebhookEventType.INVOICE_AUTHORIZED,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook event',
        accessKey: '00000000000000000000000000000000000000000000',
        status: 'AUTHORIZED',
        totalValue: 1234.56,
      },
    };

    const signature = this.signPayload(testEvent, partner.webhookSecret!);

    const response = await fetch(partner.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': testEvent.type,
        'X-Webhook-Delivery': 'test',
      },
      body: JSON.stringify(testEvent),
      signal: AbortSignal.timeout(30000),
    });

    return {
      success: response.ok,
      statusCode: response.status,
      body: await response.text(),
    };
  }

  /**
   * Get delivery logs for a partner
   */
  async getLogs(partnerId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        status: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        deliveredAt: true,
      },
    });
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(partnerId: string) {
    const newSecret = this.generateSecret();

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: { webhookSecret: newSecret },
    });

    return { webhookSecret: this.maskSecret(newSecret) };
  }

  // Helper methods
  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 12) return '***';
    return `${secret.substring(0, 8)}...${secret.substring(secret.length - 4)}`;
  }

  private signPayload(payload: any, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
