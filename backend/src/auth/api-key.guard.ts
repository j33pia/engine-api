import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API Key missing in headers (x-api-key)');
        }

        const partner = await this.prisma.partner.findUnique({
            where: { apiKey: apiKey as string },
        });

        if (!partner) {
            throw new UnauthorizedException('Invalid API Key');
        }

        // Attach partner to request for controller usage
        request.partner = partner;
        return true;
    }
}
