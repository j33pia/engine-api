import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// DTOs para Swagger
class LoginDto {
  @ApiProperty({
    example: 'admin@empresa.com.br',
    description: 'Email do usuário',
  })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  password: string;
}

class RegisterPartnerDto {
  @ApiProperty({
    example: 'Minha Software House',
    description: 'Nome da empresa parceira',
  })
  companyName: string;

  @ApiProperty({
    example: '12.345.678/0001-90',
    description: 'CNPJ do parceiro',
  })
  cnpj: string;

  @ApiProperty({
    example: 'admin@softwarehouse.com.br',
    description: 'Email do admin',
  })
  email: string;

  @ApiProperty({ example: 'senhaForte123', description: 'Senha do admin' })
  password: string;
}

class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  partnerId: string;
}

@ApiTags('🔐 Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Autenticar usuário',
    description: 'Realiza login e retorna um token JWT válido por 24h',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Post('register-partner')
  @ApiOperation({
    summary: 'Registrar novo parceiro',
    description: `
Cria um novo Partner (Software House) e um usuário Admin.

⚠️ **Atenção**: Este endpoint é para bootstrap inicial.
Em produção, deve ser protegido ou removido.

Retorna a **API Key** que será usada para autenticar requisições fiscais.
        `,
  })
  @ApiBody({ type: RegisterPartnerDto })
  @ApiResponse({
    status: 201,
    description: 'Parceiro criado com sucesso',
    schema: {
      example: {
        message: 'Partner e User criados com sucesso',
        partnerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        apiKey: 'pk_live_abc123def456',
        userEmail: 'admin@softwarehouse.com.br',
      },
    },
  })
  async registerPartner(@Body() body: RegisterPartnerDto) {
    const partner = await this.prisma.partner.create({
      data: {
        name: body.companyName,
        cnpj: body.cnpj,
        email: body.email,
      },
    });

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: 'ADMIN',
        partnerId: partner.id,
      },
    });

    return {
      message: 'Partner e User criados com sucesso',
      partnerId: partner.id,
      apiKey: partner.apiKey,
      userEmail: user.email,
    };
  }
}
