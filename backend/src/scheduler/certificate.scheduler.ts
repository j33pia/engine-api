import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEventType } from '../webhooks/dto/webhook.dto';

@Injectable()
export class CertificateSchedulerService {
  private readonly logger = new Logger(CertificateSchedulerService.name);

  // Alert thresholds in days
  private readonly ALERT_THRESHOLDS = [30, 15, 7, 3, 1];

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  /**
   * Run daily at 8:00 AM to check for expiring certificates
   */
  @Cron('0 8 * * *', {
    name: 'certificate-expiry-check',
    timeZone: 'America/Sao_Paulo',
  })
  async checkExpiringCertificates() {
    this.logger.log('Starting certificate expiry check...');

    const now = new Date();

    // Get all issuers with certificates
    const issuers = await this.prisma.issuer.findMany({
      where: {
        certExpiry: { not: null },
        partnerId: { not: null },
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        certExpiry: true,
        partnerId: true,
      },
    });

    let notificationsSent = 0;

    for (const issuer of issuers) {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(
        issuer.certExpiry!,
        now,
      );

      // Check if days matches an alert threshold
      if (this.ALERT_THRESHOLDS.includes(daysUntilExpiry)) {
        await this.sendExpiryNotification(
          issuer.partnerId!,
          issuer,
          daysUntilExpiry,
        );
        notificationsSent++;
      }
    }

    this.logger.log(
      `Certificate check complete. Checked: ${issuers.length}, Notifications sent: ${notificationsSent}`,
    );
  }

  /**
   * Send expiry notification via webhook
   */
  private async sendExpiryNotification(
    partnerId: string,
    issuer: {
      id: string;
      name: string;
      cnpj: string;
      certExpiry: Date | null;
    },
    daysUntilExpiry: number,
  ) {
    const severity = this.getSeverity(daysUntilExpiry);

    this.logger.log(
      `Sending certificate expiry notification for ${issuer.name} (${daysUntilExpiry} days left)`,
    );

    try {
      await this.webhooksService.dispatchEvent(
        partnerId,
        WebhookEventType.CERTIFICATE_EXPIRING,
        {
          issuerId: issuer.id,
          issuerName: issuer.name,
          cnpj: issuer.cnpj,
          expiresAt: issuer.certExpiry?.toISOString(),
          daysUntilExpiry,
          severity,
          message: `Certificado digital de ${issuer.name} expira em ${daysUntilExpiry} dia(s)`,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification for issuer ${issuer.id}: ${error.message}`,
      );
    }
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate: Date, now: Date): number {
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get severity based on days until expiry
   */
  private getSeverity(days: number): 'critical' | 'warning' | 'info' {
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return 'info';
  }

  /**
   * Manual trigger for testing (can be called via controller)
   */
  async triggerManualCheck(): Promise<{
    checked: number;
    notifications: number;
  }> {
    this.logger.log('Manual certificate check triggered');
    await this.checkExpiringCertificates();

    // Return stats for manual call
    const issuers = await this.prisma.issuer.count({
      where: {
        certExpiry: { not: null },
        partnerId: { not: null },
      },
    });

    return { checked: issuers, notifications: 0 }; // notifications count would need tracking
  }
}
