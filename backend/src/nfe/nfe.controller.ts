import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  ForbiddenException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { NfeService } from './nfe.service';
import { AcbrWrapperService } from './acbr-wrapper.service';
import { CreateNfeDto } from './dto/create-nfe.dto';
import { UpdateNfeDto } from './dto/update-nfe.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('📄 NFe')
@Controller('nfe')
export class NfeController {
  constructor(
    private readonly nfeService: NfeService,
    private readonly acbrService: AcbrWrapperService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  checkStatus(@Query('uf') uf: string = 'SP', @Query('cnpj') cnpj: string) {
    return this.acbrService.checkStatus(uf, cnpj || '00000000000000');
  }

  @Get('pdf/:accessKey')
  async downloadPdf(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    // Buscar invoice no banco
    const invoice = await this.prisma.invoice.findFirst({
      where: { accessKey },
      include: { issuer: true, items: true, customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('NFe não encontrada');
    }

    // Gerar DANFE em HTML - Layout Oficial
    const formatCNPJ = (cnpj: string) => {
      if (!cnpj) return 'N/A';
      const cleaned = cnpj.replace(/\D/g, '');
      return cleaned.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5',
      );
    };

    const formatCPF = (cpf: string) => {
      if (!cpf) return 'N/A';
      const cleaned = cpf.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
      }
      return formatCNPJ(cpf);
    };

    const formatAccessKey = (key: string) => {
      return key.replace(/(.{4})/g, '$1 ').trim();
    };

    const htmlDanfe = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DANFE - ${invoice.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 10mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 8pt; 
      line-height: 1.3;
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm;
      background: #fff;
    }
    .danfe { border: 1px solid #000; }
    
    /* Header Principal */
    .header-row { display: flex; border-bottom: 1px solid #000; }
    .logo-area { 
      width: 25%; 
      border-right: 1px solid #000; 
      padding: 5px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80px;
    }
    .logo-area .company-name { font-weight: bold; font-size: 10pt; text-align: center; }
    .logo-area .company-info { font-size: 7pt; text-align: center; margin-top: 3px; }
    
    .danfe-title { 
      width: 15%; 
      border-right: 1px solid #000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 5px;
    }
    .danfe-title h1 { font-size: 14pt; font-weight: bold; }
    .danfe-title .subtitle { font-size: 6pt; margin-top: 2px; }
    .danfe-title .entry-exit { 
      margin-top: 5px;
      border: 1px solid #000;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .danfe-title .entry-label { font-size: 6pt; margin-top: 2px; }
    
    .nfe-info { 
      width: 30%; 
      border-right: 1px solid #000;
      padding: 5px;
    }
    .nfe-info .nfe-number { font-size: 10pt; font-weight: bold; }
    .nfe-info .serie { font-size: 9pt; }
    .nfe-info .page { font-size: 8pt; margin-top: 3px; }
    
    .barcode-area { 
      width: 30%; 
      padding: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .barcode {
      font-family: 'Libre Barcode 128', 'Code 128', monospace;
      font-size: 40px;
      letter-spacing: 0;
      background: linear-gradient(90deg, 
        #000 2px, #fff 2px, #fff 4px, 
        #000 4px, #000 5px, #fff 5px, #fff 8px,
        #000 8px, #000 10px, #fff 10px, #fff 11px,
        #000 11px, #000 14px, #fff 14px, #fff 16px,
        #000 16px, #000 17px, #fff 17px, #fff 20px,
        #000 20px, #000 23px, #fff 23px, #fff 25px
      );
      background-size: 25px 100%;
      height: 40px;
      width: 100%;
    }
    
    /* Chave de Acesso */
    .access-key-row { 
      border-bottom: 1px solid #000; 
      padding: 3px 5px;
      display: flex;
      align-items: center;
    }
    .access-key-row .label { font-size: 6pt; color: #666; margin-right: 5px; }
    .access-key-row .value { font-family: 'Courier New', monospace; font-size: 8pt; letter-spacing: 1px; }
    
    /* Natureza da Operação e Protocolo */
    .info-row { display: flex; border-bottom: 1px solid #000; }
    .info-cell { padding: 2px 5px; border-right: 1px solid #000; }
    .info-cell:last-child { border-right: none; }
    .info-cell .label { font-size: 6pt; color: #666; display: block; }
    .info-cell .value { font-size: 8pt; font-weight: bold; }
    .info-cell.flex-1 { flex: 1; }
    .info-cell.flex-2 { flex: 2; }
    .info-cell.flex-3 { flex: 3; }
    
    /* Seções */
    .section { border-bottom: 1px solid #000; }
    .section-header { 
      background: #f0f0f0; 
      padding: 2px 5px; 
      font-weight: bold; 
      font-size: 7pt;
      border-bottom: 1px solid #000;
    }
    .section-content { display: flex; flex-wrap: wrap; }
    .field { padding: 2px 5px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
    .field:last-child { border-right: none; }
    .field .label { font-size: 5pt; color: #666; display: block; text-transform: uppercase; }
    .field .value { font-size: 8pt; min-height: 12px; }
    
    .w-10 { width: 10%; }
    .w-15 { width: 15%; }
    .w-20 { width: 20%; }
    .w-25 { width: 25%; }
    .w-30 { width: 30%; }
    .w-33 { width: 33.33%; }
    .w-40 { width: 40%; }
    .w-50 { width: 50%; }
    .w-60 { width: 60%; }
    .w-70 { width: 70%; }
    .w-100 { width: 100%; }
    
    /* Tabela de Produtos */
    .products-table { width: 100%; border-collapse: collapse; }
    .products-table th { 
      background: #f0f0f0; 
      font-size: 6pt; 
      padding: 2px 3px; 
      border: 1px solid #000;
      text-align: center;
    }
    .products-table td { 
      font-size: 7pt; 
      padding: 2px 3px; 
      border: 1px solid #ccc;
      border-left: 1px solid #000;
      border-right: 1px solid #000;
    }
    .products-table td.text-right { text-align: right; }
    .products-table td.text-center { text-align: center; }
    
    /* Totais */
    .totals-row { display: flex; }
    .total-field { 
      flex: 1; 
      padding: 3px 5px; 
      border-right: 1px solid #000;
      text-align: right;
    }
    .total-field:last-child { border-right: none; }
    .total-field .label { font-size: 6pt; color: #666; }
    .total-field .value { font-size: 9pt; font-weight: bold; }
    
    /* Informações Adicionais */
    .additional-info { padding: 5px; min-height: 60px; font-size: 7pt; }
    
    /* Footer */
    .footer { 
      text-align: center; 
      padding: 5px; 
      font-size: 7pt; 
      color: #666;
      border-top: 1px solid #000;
      margin-top: 10px;
    }
    .footer .protocol { font-weight: bold; color: #000; }
    
    .badge-authorized { 
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
    }
    .badge-canceled { 
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="danfe">
    <!-- Cabeçalho Principal -->
    <div class="header-row">
      <div class="logo-area">
        <div class="company-name">${invoice.issuer?.name || 'EMPRESA EMITENTE'}</div>
        <div class="company-info">
          ${invoice.issuer?.address ? invoice.issuer.address + '<br>' : ''}
          ${invoice.issuer?.city || ''} - ${invoice.issuer?.state || ''}<br>
          CNPJ: ${formatCNPJ(invoice.issuer?.cnpj)}
        </div>
      </div>
      <div class="danfe-title">
        <h1>DANFE</h1>
        <div class="subtitle">Documento Auxiliar da<br>Nota Fiscal Eletrônica</div>
        <div class="entry-exit">1</div>
        <div class="entry-label">0 - Entrada<br>1 - Saída</div>
      </div>
      <div class="nfe-info">
        <div class="nfe-number">Nº ${String(invoice.number).padStart(9, '0')}</div>
        <div class="serie">Série ${invoice.series}</div>
        <div class="page">Folha 1/1</div>
        <div style="margin-top: 5px;">
          ${invoice.status === 'AUTHORIZED' ? '<span class="badge-authorized">✓ AUTORIZADA</span>' : ''}
          ${invoice.status === 'CANCELED' ? '<span class="badge-canceled">✗ CANCELADA</span>' : ''}
        </div>
      </div>
      <div class="barcode-area">
        <div class="barcode"></div>
        <div style="font-size: 7pt; margin-top: 3px; font-family: monospace;">
          ${formatAccessKey(accessKey)}
        </div>
      </div>
    </div>

    <!-- Chave de Acesso -->
    <div class="access-key-row">
      <span class="label">CHAVE DE ACESSO</span>
      <span class="value">${formatAccessKey(accessKey)}</span>
    </div>

    <!-- Consulta e Protocolo -->
    <div class="info-row">
      <div class="info-cell flex-2">
        <span class="label">CONSULTA DE AUTENTICIDADE NO PORTAL NACIONAL DA NF-e</span>
        <span class="value">www.nfe.fazenda.gov.br/portal</span>
      </div>
      <div class="info-cell flex-1">
        <span class="label">PROTOCOLO DE AUTORIZAÇÃO</span>
        <span class="value">${(invoice as any).protocol || '135260000000000'}</span>
      </div>
    </div>

    <!-- Natureza da Operação -->
    <div class="info-row">
      <div class="info-cell flex-3">
        <span class="label">NATUREZA DA OPERAÇÃO</span>
        <span class="value">VENDA DE MERCADORIA</span>
      </div>
      <div class="info-cell flex-1">
        <span class="label">DATA EMISSÃO</span>
        <span class="value">${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="info-cell flex-1">
        <span class="label">DATA SAÍDA</span>
        <span class="value">${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    <!-- Emitente -->
    <div class="section">
      <div class="section-header">EMITENTE</div>
      <div class="section-content">
        <div class="field w-60"><span class="label">RAZÃO SOCIAL</span><span class="value">${invoice.issuer?.name || 'N/A'}</span></div>
        <div class="field w-25"><span class="label">CNPJ</span><span class="value">${formatCNPJ(invoice.issuer?.cnpj)}</span></div>
        <div class="field w-15"><span class="label">I.E.</span><span class="value">${invoice.issuer?.ie || 'ISENTO'}</span></div>
      </div>
      <div class="section-content">
        <div class="field w-50"><span class="label">ENDEREÇO</span><span class="value">${invoice.issuer?.address || 'N/A'}</span></div>
        <div class="field w-20"><span class="label">BAIRRO</span><span class="value">${invoice.issuer?.neighborhood || 'N/A'}</span></div>
        <div class="field w-15"><span class="label">CEP</span><span class="value">${invoice.issuer?.cep || 'N/A'}</span></div>
        <div class="field w-15"><span class="label">UF</span><span class="value">${invoice.issuer?.state || 'N/A'}</span></div>
      </div>
      <div class="section-content">
        <div class="field w-40" style="border-bottom: none;"><span class="label">MUNICÍPIO</span><span class="value">${invoice.issuer?.city || 'N/A'}</span></div>
        <div class="field w-30" style="border-bottom: none;"><span class="label">FONE/FAX</span><span class="value">${invoice.issuer?.phone || 'N/A'}</span></div>
        <div class="field w-30" style="border-bottom: none;"><span class="label">INSCRIÇÃO ESTADUAL</span><span class="value">${invoice.issuer?.ie || 'ISENTO'}</span></div>
      </div>
    </div>

    <!-- Destinatário -->
    <div class="section">
      <div class="section-header">DESTINATÁRIO / REMETENTE</div>
      <div class="section-content">
        <div class="field w-60"><span class="label">NOME / RAZÃO SOCIAL</span><span class="value">${invoice.destName || 'CONSUMIDOR FINAL'}</span></div>
        <div class="field w-25"><span class="label">CNPJ / CPF</span><span class="value">${formatCPF(invoice.destCNPJ || '')}</span></div>
        <div class="field w-15"><span class="label">DATA EMISSÃO</span><span class="value">${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</span></div>
      </div>
      <div class="section-content">
        <div class="field w-50"><span class="label">ENDEREÇO</span><span class="value">${invoice.customer?.address || 'N/A'}</span></div>
        <div class="field w-20"><span class="label">BAIRRO</span><span class="value">${invoice.customer?.neighborhood || 'N/A'}</span></div>
        <div class="field w-15"><span class="label">CEP</span><span class="value">${invoice.customer?.cep || 'N/A'}</span></div>
        <div class="field w-15" style="border-bottom: none;"><span class="label">I.E.</span><span class="value">N/A</span></div>
      </div>
      <div class="section-content">
        <div class="field w-40" style="border-bottom: none;"><span class="label">MUNICÍPIO</span><span class="value">${invoice.customer?.city || 'N/A'}</span></div>
        <div class="field w-30" style="border-bottom: none;"><span class="label">FONE/FAX</span><span class="value">${invoice.customer?.phone || 'N/A'}</span></div>
        <div class="field w-15" style="border-bottom: none;"><span class="label">UF</span><span class="value">${invoice.customer?.state || 'N/A'}</span></div>
        <div class="field w-15" style="border-bottom: none;"><span class="label">HORA SAÍDA</span><span class="value">${new Date(invoice.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
      </div>
    </div>

    <!-- Produtos -->
    <div class="section">
      <div class="section-header">DADOS DOS PRODUTOS / SERVIÇOS</div>
      <table class="products-table">
        <thead>
          <tr>
            <th style="width: 8%;">CÓDIGO</th>
            <th style="width: 35%;">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
            <th style="width: 8%;">NCM/SH</th>
            <th style="width: 5%;">CST</th>
            <th style="width: 6%;">CFOP</th>
            <th style="width: 5%;">UN</th>
            <th style="width: 8%;">QTD</th>
            <th style="width: 10%;">V.UNIT</th>
            <th style="width: 10%;">V.TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${
            invoice.items
              ?.map(
                (item) => `
            <tr>
              <td class="text-center">${item.itemCode || '-'}</td>
              <td>${item.description}</td>
              <td class="text-center">${item.ncm || '-'}</td>
              <td class="text-center">000</td>
              <td class="text-center">5102</td>
              <td class="text-center">UN</td>
              <td class="text-right">${Number(item.quantity).toFixed(4)}</td>
              <td class="text-right">${Number(item.unitPrice).toFixed(2)}</td>
              <td class="text-right">${Number(item.totalPrice).toFixed(2)}</td>
            </tr>
          `,
              )
              .join('') ||
            '<tr><td colspan="9" style="text-align: center;">Sem itens</td></tr>'
          }
        </tbody>
      </table>
    </div>

    <!-- Totais -->
    <div class="section">
      <div class="section-header">CÁLCULO DO IMPOSTO</div>
      <div class="totals-row">
        <div class="total-field"><span class="label">BASE CÁLC. ICMS</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR ICMS</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">BASE CÁLC. ICMS ST</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR ICMS ST</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR IPI</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR TOTAL PRODUTOS</span><span class="value">${Number(invoice.amount).toFixed(2)}</span></div>
      </div>
      <div class="totals-row" style="border-top: 1px solid #000;">
        <div class="total-field"><span class="label">VALOR FRETE</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR SEGURO</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">DESCONTO</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">OUTRAS DESP.</span><span class="value">0,00</span></div>
        <div class="total-field"><span class="label">VALOR TOTAL IPI</span><span class="value">0,00</span></div>
        <div class="total-field" style="background: #f0f0f0;"><span class="label">VALOR TOTAL DA NOTA</span><span class="value" style="font-size: 12pt; color: #000;">R$ ${Number(invoice.amount).toFixed(2)}</span></div>
      </div>
    </div>

    <!-- Transportador -->
    <div class="section">
      <div class="section-header">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
      <div class="section-content">
        <div class="field w-50"><span class="label">RAZÃO SOCIAL</span><span class="value">-</span></div>
        <div class="field w-10"><span class="label">FRETE</span><span class="value">9-Sem</span></div>
        <div class="field w-15"><span class="label">CÓDIGO ANTT</span><span class="value">-</span></div>
        <div class="field w-15"><span class="label">PLACA</span><span class="value">-</span></div>
        <div class="field w-10" style="border-bottom: none;"><span class="label">UF</span><span class="value">-</span></div>
      </div>
      <div class="section-content">
        <div class="field w-50" style="border-bottom: none;"><span class="label">ENDEREÇO</span><span class="value">-</span></div>
        <div class="field w-30" style="border-bottom: none;"><span class="label">MUNICÍPIO</span><span class="value">-</span></div>
        <div class="field w-10" style="border-bottom: none;"><span class="label">UF</span><span class="value">-</span></div>
        <div class="field w-10" style="border-bottom: none;"><span class="label">CNPJ/CPF</span><span class="value">-</span></div>
      </div>
    </div>

    <!-- Informações Adicionais -->
    <div class="section" style="border-bottom: none;">
      <div class="section-header">INFORMAÇÕES ADICIONAIS</div>
      <div class="additional-info">
        Documento Fiscal Eletrônico emitido em ambiente de HOMOLOGAÇÃO (Testes).<br>
        Esta NF-e foi autorizada pela SEFAZ e possui validade jurídica.
      </div>
    </div>
  </div>

  <div class="footer">
    <p class="protocol">PROTOCOLO: ${(invoice as any).protocol || '135260000000000'} - ${new Date(invoice.createdAt).toLocaleString('pt-BR')}</p>
    <p>Consulte a autenticidade no portal: www.nfe.fazenda.gov.br/portal</p>
    <p style="color: #999; margin-top: 5px;">Ambiente: HOMOLOGAÇÃO (Mock) | EngineAPI v2.0</p>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${accessKey}-danfe.html"`,
    );
    res.send(htmlDanfe);
  }

  @Get('xml/:accessKey')
  async downloadXml(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const xmlPath = path.join('/app/xml', `${accessKey}-nfe.xml`);

    if (!fs.existsSync(xmlPath)) {
      throw new NotFoundException('XML não encontrado');
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${accessKey}-nfe.xml"`,
    );

    const fileStream = fs.createReadStream(xmlPath);
    fileStream.pipe(res);
  }

  /**
   * Download XML da Carta de Correção (CC-e)
   */
  @Get('cce/:accessKey/xml')
  async downloadCceXml(
    @Param('accessKey') accessKey: string,
    @Query('seq') seq: string,
    @Res() res: Response,
  ) {
    const sequence = parseInt(seq) || 1;

    // Buscar invoice e evento de CC-e
    const invoice = await this.prisma.invoice.findFirst({
      where: { accessKey },
      include: {
        fiscalEvents: {
          where: { eventType: 'CCE', sequence },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('NFe não encontrada');
    }

    const cceEvent = invoice.fiscalEvents[0];
    if (!cceEvent || !cceEvent.xml) {
      throw new NotFoundException(`CC-e sequência ${sequence} não encontrada`);
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${accessKey}-cce-${sequence}.xml"`,
    );
    res.send(cceEvent.xml);
  }

  /**
   * Download PDF da Carta de Correção (CC-e)
   * Retorna um PDF simples com as informações do evento
   */
  @Get('cce/:accessKey/pdf')
  async downloadCcePdf(
    @Param('accessKey') accessKey: string,
    @Query('seq') seq: string,
    @Res() res: Response,
  ) {
    const sequence = parseInt(seq) || 1;

    // Buscar invoice e evento de CC-e
    const invoice = await this.prisma.invoice.findFirst({
      where: { accessKey },
      include: {
        fiscalEvents: {
          where: { eventType: 'CCE', sequence },
        },
        issuer: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('NFe não encontrada');
    }

    const cceEvent = invoice.fiscalEvents[0];
    if (!cceEvent) {
      throw new NotFoundException(`CC-e sequência ${sequence} não encontrada`);
    }

    // Gerar HTML simples para impressão (pode ser melhorado com biblioteca PDF)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carta de Correção Eletrônica</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .info { margin: 20px 0; }
          .info strong { display: inline-block; width: 180px; }
          .correcao { background: #f5f5f5; padding: 20px; border-left: 4px solid #333; margin: 20px 0; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>CARTA DE CORREÇÃO ELETRÔNICA</h1>
        <div class="info">
          <p><strong>Chave de Acesso:</strong> ${accessKey}</p>
          <p><strong>Número NFe:</strong> ${invoice.number} - Série ${invoice.series}</p>
          <p><strong>Emitente:</strong> ${invoice.issuer?.name || 'N/A'}</p>
          <p><strong>CNPJ Emitente:</strong> ${invoice.issuer?.cnpj || 'N/A'}</p>
          <p><strong>Sequência CC-e:</strong> ${sequence}</p>
          <p><strong>Protocolo:</strong> ${cceEvent.protocol || 'N/A'}</p>
          <p><strong>Data:</strong> ${cceEvent.createdAt.toLocaleDateString('pt-BR')} ${cceEvent.createdAt.toLocaleTimeString('pt-BR')}</p>
        </div>
        <h3>Correção:</h3>
        <div class="correcao">
          ${cceEvent.description}
        </div>
        <div class="footer">
          <p>A Carta de Correção é disciplinada pelo § 1º-A do art. 7º do Convênio S/N, de 15 de dezembro de 1970 
          e pode ser utilizada para regularização de erro ocorrido na emissão de documento fiscal, desde que o 
          erro não esteja relacionado com: I - as variáveis que determinam o valor do imposto tais como: base 
          de cálculo, alíquota, diferença de preço, quantidade, valor da operação ou da prestação; II - a 
          correção de dados cadastrais que implique mudança do remetente ou do destinatário; III - a data de 
          emissão ou de saída.</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${accessKey}-cce-${sequence}.html"`,
    );
    res.send(htmlContent);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async create(@Body() createNfeDto: CreateNfeDto, @Request() req: any) {
    const partner = req.partner; // Attached by Guard

    // 1. Resolve Issuer
    // Find the Issuer associated with this Partner.
    // In a real scenario, we might want to allow the partner to specify WHICH issuer they are emitting for
    // (if they have multiple). For now, we pick the first one or validate against a provided header.
    const issuer = await this.prisma.issuer.findFirst({
      where: { partnerId: partner.id },
    });

    if (!issuer) {
      throw new ForbiddenException(
        'No issuer company found for this API Key. Please register a company first.',
      );
    }

    return this.nfeService.create(createNfeDto, issuer.id);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.nfeService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nfeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNfeDto: UpdateNfeDto) {
    return this.nfeService.update(id, updateNfeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nfeService.remove(id);
  }

  /**
   * Endpoint para cancelar uma NFe
   */
  @Post(':accessKey/cancelar')
  @UseGuards(ApiKeyGuard)
  async cancelar(
    @Param('accessKey') accessKey: string,
    @Body() body: { justificativa: string },
    @Request() req: any,
  ) {
    const apiKey = req.headers['x-api-key'];

    // Buscar partner pelo API Key
    const partner = await this.prisma.partner.findUnique({
      where: { apiKey },
      include: { issuers: true },
    });

    if (!partner || partner.issuers.length === 0) {
      throw new ForbiddenException('Nenhum emissor configurado');
    }

    // Pegar primeiro emissor (ou buscar pelo accessKey)
    const issuer = partner.issuers[0];

    // Verificar se NFe pertence ao partner
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        accessKey,
        issuer: {
          partnerId: partner.id,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('NFe não encontrada');
    }

    // Verificar status da NFe
    if (invoice.status !== 'AUTHORIZED') {
      throw new ForbiddenException(
        'Apenas NFes autorizadas podem ser canceladas',
      );
    }

    // Verificar prazo de 24h (em homologação é 168h)
    const horasDesdeAutorizacao =
      (Date.now() - invoice.createdAt.getTime()) / (1000 * 60 * 60);

    if (horasDesdeAutorizacao > 168) {
      throw new ForbiddenException('Prazo de cancelamento expirado');
    }

    // Cancelar via ACBr
    const result = await this.acbrService.cancelar(
      accessKey,
      body.justificativa,
      issuer,
    );

    // Atualizar status no banco
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELED',
      },
    });

    return result;
  }

  /**
   * Endpoint para enviar Carta de Correção Eletrônica (CC-e)
   */
  @Post(':accessKey/carta-correcao')
  @UseGuards(ApiKeyGuard)
  async cartaCorrecao(
    @Param('accessKey') accessKey: string,
    @Body() body: { correcao: string },
    @Request() req: any,
  ) {
    const apiKey = req.headers['x-api-key'];

    // Buscar partner pelo API Key
    const partner = await this.prisma.partner.findUnique({
      where: { apiKey },
      include: { issuers: true },
    });

    if (!partner || partner.issuers.length === 0) {
      throw new ForbiddenException('Nenhum emissor configurado');
    }

    const issuer = partner.issuers[0];

    // Verificar se NFe pertence ao partner
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        accessKey,
        issuer: {
          partnerId: partner.id,
        },
      },
      include: {
        fiscalEvents: {
          where: { eventType: 'CCE' },
          orderBy: { sequence: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('NFe não encontrada');
    }

    // Verificar status da NFe
    if (invoice.status !== 'AUTHORIZED') {
      throw new ForbiddenException(
        'Apenas NFes autorizadas podem receber CC-e',
      );
    }

    // Determinar sequência (último evento + 1)
    const ultimaCCe = invoice.fiscalEvents[0];
    const sequencia = ultimaCCe ? ultimaCCe.sequence + 1 : 1;

    if (sequencia > 20) {
      throw new ForbiddenException('Limite de 20 CC-e por NFe atingido');
    }

    // Enviar CC-e via ACBr
    const result = await this.acbrService.enviarCartaCorrecao(
      accessKey,
      body.correcao,
      sequencia,
      issuer,
    );

    // Salvar evento no banco
    await this.prisma.fiscalEvent.create({
      data: {
        invoiceId: invoice.id,
        eventType: 'CCE',
        sequence: sequencia,
        description: body.correcao,
        protocol: result.protocol,
        xml: result.xml,
      },
    });

    return result;
  }
}
