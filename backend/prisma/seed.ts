import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Create Master Partner (Software House)
    const partner = await prisma.partner.upsert({
        where: { cnpj: '00000000000000' },
        update: {},
        create: {
            name: '3X Tecnologia (Mestre)',
            cnpj: '00000000000000',
            email: 'contato@3x.com',
            phone: '11999999999'
        },
    });

    console.log('Partner created:', partner.name);

    // 2. Create Admin User
    const user = await prisma.user.upsert({
        where: { email: 'admin@3x.com' },
        update: { password: hashedPassword },
        create: {
            email: 'admin@3x.com',
            password: hashedPassword,
            role: 'ADMIN',
            partnerId: partner.id
        },
    });

    console.log('User created:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
