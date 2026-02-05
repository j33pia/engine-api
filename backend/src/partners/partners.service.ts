import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(partnerId: string) {
    return this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        webhookUrl: true,
        apiKey: true, // Returning API Key as requested for the dev panel
      },
    });
  }

  async regenerateApiKey(partnerId: string) {
    const newKey = randomUUID();
    return this.prisma.partner.update({
      where: { id: partnerId },
      data: { apiKey: newKey },
    });
  }

  async updateWebhook(partnerId: string, webhookUrl: string) {
    return this.prisma.partner.update({
      where: { id: partnerId },
      data: { webhookUrl },
    });
  }
}
