import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private prisma: PrismaService) { }

    async notifyInvoiceStatus(partnerId: string, invoice: any) {
        // 1. Get Partner Webhook URL
        const partner = await this.prisma.partner.findUnique({
            where: { id: partnerId },
            select: { webhookUrl: true }
        });

        if (!partner || !partner.webhookUrl) {
            this.logger.debug(`No webhook URL configured for partner ${partnerId}`);
            return;
        }

        // 2. Fire and Forget Notification
        this.sendWebhook(partner.webhookUrl, invoice).catch(err => {
            this.logger.error(`Failed to send webhook to ${partner.webhookUrl}: ${err.message}`);
        });
    }

    private async sendWebhook(url: string, payload: any) {
        this.logger.log(`Sending webhook to ${url} for Invoice ${payload.accessKey}`);
        await axios.post(url, {
            event: 'INVOICE_STATUS_CHANGED',
            data: {
                id: payload.id,
                accessKey: payload.accessKey,
                status: payload.status,
                sefaMult: payload.sefaMult,
                xml: payload.xml, // Optional depending on payload size policy
                timestamp: new Date()
            }
        }, {
            timeout: 5000 // 5s timeout
        });
    }
}
