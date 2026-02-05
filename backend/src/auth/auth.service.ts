import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // Validação de Usuário (Login no Painel)
    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { partner: true },
        });

        if (user) {
            const isMatch = await bcrypt.compare(pass, user.password);
            console.log(`[AuthDebug] Login attempt for ${email}. Match: ${isMatch}`);
            if (isMatch) {
                const { password, ...result } = user;
                return result;
            } else {
                // Temp debug: log hash comparison (be careful in prod!)
                // console.log(`[AuthDebug] Hash from DB: ${user.password}`);
            }
        } else {
            console.log(`[AuthDebug] User not found: ${email}`);
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            partnerId: user.partnerId,
            role: user.role
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.partner?.name || 'Admin',
                role: user.role
            }
        };
    }

    // Validação de Partner (API Machine-to-Machine)
    async validateApiKey(apiKey: string) {
        const partner = await this.prisma.partner.findUnique({
            where: { apiKey },
        });

        if (!partner) {
            throw new UnauthorizedException('Invalid API Key');
        }

        return partner;
    }
}
