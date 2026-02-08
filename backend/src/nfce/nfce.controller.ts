import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { NfceService } from './nfce.service';
import { NfceWrapperService } from './nfce-wrapper.service';
import { CreateNfceDto } from './dto/create-nfce.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Controller NFC-e (Modelo 65)
 *
 * Endpoints para emissão, consulta e download de NFCe.
 * Utiliza o NfceWrapperService independente do módulo NFe.
 */
@ApiTags('🧾 NFCe')
@Controller('nfce')
export class NfceController {
  constructor(
    private readonly nfceService: NfceService,
    private readonly nfceWrapper: NfceWrapperService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Status do serviço NFCe na SEFAZ
   */
  @Get('status')
  @ApiOperation({ summary: 'Verificar status do serviço NFCe' })
  @ApiQuery({ name: 'uf', required: false, example: 'SP' })
  @ApiResponse({ status: 200, description: 'Status do serviço retornado' })
  async checkStatus(@Query('uf') uf: string = 'SP') {
    const status = await this.nfceWrapper.checkStatus(uf, '00000000000000');
    return {
      ...status,
      model: '65',
      service: 'NFCe',
      provider: this.nfceWrapper.isUsingMock() ? 'mock' : 'acbr',
    };
  }

  /**
   * Emitir NFCe
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Emitir NFCe (Modelo 65)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'NFCe emitida com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem emissor configurado' })
  async create(@Body() createNfceDto: CreateNfceDto, @Request() req: any) {
    const partner = req.partner;

    // Buscar Issuer do Partner
    const issuer = await this.prisma.issuer.findFirst({
      where: { partnerId: partner.id },
    });

    if (!issuer) {
      throw new ForbiddenException(
        'Nenhum emissor configurado. Registre uma empresa primeiro.',
      );
    }

    return this.nfceService.emitir(createNfceDto, issuer.id);
  }

  /**
   * Listar NFCes emitidas
   */
  @Get()
  @ApiOperation({ summary: 'Listar NFCes emitidas' })
  @ApiResponse({ status: 200, description: 'Lista de NFCes' })
  async findAll() {
    return this.nfceService.findAll();
  }

  /**
   * Download PDF (Cupom) da NFCe
   */
  @Get('pdf/:accessKey')
  @ApiOperation({ summary: 'Download do cupom fiscal (PDF/HTML)' })
  @ApiResponse({ status: 200, description: 'Cupom fiscal da NFCe' })
  @ApiResponse({ status: 404, description: 'NFCe não encontrada' })
  async downloadPdf(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { accessKey, model: '65' },
      include: { issuer: true, items: true },
    });

    if (!invoice) {
      throw new NotFoundException('NFCe não encontrada');
    }

    // Gerar cupom HTML estilo impressora térmica (80mm)
    const htmlCupom = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NFCe - Cupom Fiscal</title>
  <style>
    @page { size: 80mm auto; margin: 5mm; }
    body { 
      font-family: 'Courier New', monospace; 
      font-size: 10px; 
      width: 80mm; 
      margin: 0 auto; 
      padding: 5mm;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    .item { display: flex; justify-content: space-between; }
    .qrcode { text-align: center; margin: 10px 0; }
    h3 { margin: 5px 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="center bold">
    <h3>${invoice.issuer?.name || 'EMPRESA'}</h3>
    <p>CNPJ: ${invoice.issuer?.cnpj || 'N/A'}</p>
    <p>${invoice.issuer?.address || ''}, ${invoice.issuer?.city || ''}-${invoice.issuer?.state || ''}</p>
  </div>
  
  <div class="line"></div>
  <div class="center bold">CUPOM FISCAL ELETRÔNICO - NFCe</div>
  <div class="line"></div>
  
  <p><strong>Nº:</strong> ${invoice.number} | Série: ${invoice.series}</p>
  <p><strong>Data:</strong> ${new Date(invoice.createdAt).toLocaleString('pt-BR')}</p>
  <p><strong>Dest:</strong> ${invoice.destName || 'CONSUMIDOR FINAL'}</p>
  
  <div class="line"></div>
  <div class="center bold">ITENS</div>
  <div class="line"></div>
  
  ${invoice.items
    .map(
      (item, i) => `
    <p>${i + 1}. ${item.description}</p>
    <div class="item">
      <span>${item.quantity}x R$ ${Number(item.unitPrice).toFixed(2)}</span>
      <span>R$ ${Number(item.totalPrice).toFixed(2)}</span>
    </div>
  `,
    )
    .join('')}
  
  <div class="line"></div>
  <div class="item bold">
    <span>TOTAL</span>
    <span>R$ ${Number(invoice.amount).toFixed(2)}</span>
  </div>
  <div class="line"></div>
  
  <div class="qrcode">
    <p>📱 CONSULTE PELA CHAVE DE ACESSO:</p>
    <p style="font-size: 8px; word-break: break-all;">${accessKey}</p>
    <p>portal.nfe.fazenda.gov.br/nfce</p>
  </div>
  
  <div class="line"></div>
  <div class="center" style="font-size: 8px;">
    <p>Documento Auxiliar da NFCe</p>
    <p>Ambiente: ${this.nfceWrapper.isUsingMock() ? 'HOMOLOGAÇÃO (Mock)' : 'PRODUÇÃO'}</p>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${accessKey}-nfce.html"`,
    );
    res.send(htmlCupom);
  }

  /**
   * Download XML da NFCe
   */
  @Get('xml/:accessKey')
  @ApiOperation({ summary: 'Download do XML da NFCe' })
  @ApiResponse({ status: 200, description: 'XML da NFCe' })
  @ApiResponse({ status: 404, description: 'NFCe não encontrada' })
  async downloadXml(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { accessKey, model: '65' },
    });

    if (!invoice) {
      throw new NotFoundException('NFCe não encontrada');
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${accessKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <mod>65</mod>
        <serie>${invoice.series}</serie>
        <nNF>${invoice.number}</nNF>
        <dhEmi>${new Date(invoice.createdAt).toISOString()}</dhEmi>
        <tpAmb>2</tpAmb>
      </ide>
      <emit>
        <CNPJ>00000000000000</CNPJ>
        <xNome>EMPRESA</xNome>
      </emit>
      <dest>
        <xNome>${invoice.destName || 'CONSUMIDOR FINAL'}</xNome>
      </dest>
      <total>
        <vNF>${Number(invoice.amount).toFixed(2)}</vNF>
      </total>
    </infNFe>
  </NFe>
  <protNFe>
    <nProt>000000000000000</nProt>
    <dhRecbto>${new Date().toISOString()}</dhRecbto>
    <cStat>100</cStat>
    <xMotivo>Autorizado o uso da NFC-e</xMotivo>
  </protNFe>
</nfeProc>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${accessKey}-nfce.xml"`,
    );
    res.send(xmlContent);
  }

  /**
   * Buscar NFCe por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar NFCe por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes da NFCe' })
  async findOne(@Param('id') id: string) {
    return this.nfceService.findOne(id);
  }
}
