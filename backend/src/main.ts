import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ========================================
  // Swagger / OpenAPI Configuration
  // ========================================
  const config = new DocumentBuilder()
    .setTitle('EngineAPI - Motor Fiscal SaaS')
    .setDescription(
      `
## 🚀 API de Emissão Fiscal B2B2B

EngineAPI é uma plataforma SaaS para emissão de documentos fiscais eletrônicos brasileiros.

### Documentos Suportados
- **NFe** (Modelo 55) - Nota Fiscal Eletrônica
- **NFCe** (Modelo 65) - Nota Fiscal de Consumidor Eletrônica
- **MDFe** (Modelo 58) - Manifesto Eletrônico de Documentos Fiscais

### Autenticação
Todas as rotas protegidas requerem um token JWT no header:
\`\`\`
Authorization: Bearer <seu_token>
\`\`\`

### Rate Limits
- **Basic**: 100 req/min
- **Pro**: 500 req/min
- **Enterprise**: Ilimitado

### Ambientes
- **Homologação**: Para testes (SEFAZ sandbox)
- **Produção**: Emissões reais

### Suporte
- Email: suporte@3xtec.com.br
- Docs: https://docs.engineapi.com.br
    `,
    )
    .setVersion('2.0.0')
    .setContact('3X Tecnologia', 'https://3xtec.com.br', 'api@3xtec.com.br')
    .setLicense('Proprietário', 'https://engineapi.com.br/termos')
    .addServer('http://localhost:3001', 'Desenvolvimento Local')
    .addServer('https://api.engineapi.com.br', 'Produção')
    .addServer('https://sandbox.engineapi.com.br', 'Sandbox/Homologação')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via /auth/login',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key do Partner (uso alternativo)',
      },
      'API-Key',
    )
    // Tags organizadas por domínio
    .addTag('🔐 Auth', 'Autenticação e registro de parceiros')
    .addTag('📊 Analytics', 'Métricas e dashboard')
    .addTag('🏢 Companies', 'Gestão de empresas emitentes (Issuers)')
    .addTag('📄 NFe', 'Nota Fiscal Eletrônica (Modelo 55)')
    .addTag('🧾 NFCe', 'Nota Fiscal de Consumidor (Modelo 65)')
    .addTag('🚚 MDFe', 'Manifesto de Documentos Fiscais (Modelo 58)')
    .addTag('👥 Partners', 'Gestão de parceiros/software houses')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Swagger UI com customizações
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'EngineAPI Docs',
    customfavIcon: 'https://3xtec.com.br/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2.5em; }
      .swagger-ui .info .description { max-width: 800px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        theme: 'monokai',
      },
    },
  });

  const port = process.env.PORT || 3000;

  // Enable CORS
  app.enableCors({
    origin: '*', // Em produção, restrinja para o domínio do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger Docs: ${await app.getUrl()}/api-docs`);
}
bootstrap();
