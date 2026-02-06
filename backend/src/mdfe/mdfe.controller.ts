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
} from '@nestjs/swagger';
import type { Response } from 'express';
import { MdfeService } from './mdfe.service';
import { CreateMdfeDto } from './dto/create-mdfe.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AcbrWrapperService } from '../nfe/acbr-wrapper.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('🚚 MDFe')
@Controller('mdfe')
export class MdfeController {
  constructor(
    private readonly mdfeService: MdfeService,
    private readonly acbrService: AcbrWrapperService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Status do serviço MDFe
   */
  @Get('status')
  async checkStatus(@Query('uf') uf: string = 'SP') {
    const status = await this.acbrService.checkStatus(uf, '00000000000000');
    return {
      ...status,
      model: '58',
      service: 'MDFe',
    };
  }

  /**
   * Emitir MDFe
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  async create(@Body() createMdfeDto: CreateMdfeDto, @Request() req: any) {
    const partner = req.partner;

    const issuer = await this.prisma.issuer.findFirst({
      where: { partnerId: partner.id },
    });

    if (!issuer) {
      throw new ForbiddenException(
        'Nenhum emissor configurado. Registre uma empresa primeiro.',
      );
    }

    return this.mdfeService.emitir(createMdfeDto, issuer.id);
  }

  /**
   * Listar MDFes emitidas
   */
  @Get()
  async findAll(@Query('companyId') companyId?: string) {
    return this.mdfeService.findAll(companyId);
  }

  /**
   * Download PDF do DAMDFE
   */
  @Get('pdf/:accessKey')
  async downloadPdf(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const mdfe = await this.prisma.mdfe.findFirst({
      where: { accessKey },
      include: { issuer: true },
    });

    if (!mdfe) {
      throw new NotFoundException('MDFe não encontrado');
    }

    // Gerar DAMDFE HTML
    const htmlDamdfe = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DAMDFE - ${accessKey}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border: 2px solid #000; padding: 10px; margin-bottom: 20px; }
    .section { border: 1px solid #000; padding: 10px; margin-bottom: 10px; }
    .section h3 { margin: 0 0 10px 0; background: #f0f0f0; padding: 5px; }
    .row { display: flex; gap: 20px; margin-bottom: 5px; }
    .field { flex: 1; }
    .field label { font-weight: bold; font-size: 10px; color: #666; }
    .field span { display: block; font-size: 14px; }
    .docs { margin-top: 10px; }
    .docs table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .docs th, .docs td { border: 1px solid #ccc; padding: 5px; text-align: left; }
    .footer { text-align: center; font-size: 10px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>DAMDFE - Documento Auxiliar do MDF-e</h2>
    <p><strong>Modelo 58</strong></p>
  </div>

  <div class="section">
    <h3>IDENTIFICAÇÃO</h3>
    <div class="row">
      <div class="field">
        <label>CHAVE DE ACESSO</label>
        <span style="font-family: monospace; font-size: 12px;">${accessKey}</span>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>NÚMERO</label>
        <span>${mdfe.number}</span>
      </div>
      <div class="field">
        <label>SÉRIE</label>
        <span>${mdfe.series}</span>
      </div>
      <div class="field">
        <label>STATUS</label>
        <span>${mdfe.status}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>EMITENTE</h3>
    <div class="row">
      <div class="field">
        <label>RAZÃO SOCIAL</label>
        <span>${mdfe.issuer?.name || 'N/A'}</span>
      </div>
      <div class="field">
        <label>CNPJ</label>
        <span>${mdfe.issuer?.cnpj || 'N/A'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>VIAGEM</h3>
    <div class="row">
      <div class="field">
        <label>UF INÍCIO</label>
        <span>${mdfe.ufStart}</span>
      </div>
      <div class="field">
        <label>UF FIM</label>
        <span>${mdfe.ufEnd}</span>
      </div>
      <div class="field">
        <label>DATA VIAGEM</label>
        <span>${new Date(mdfe.dtViagem).toLocaleString('pt-BR')}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>VEÍCULO</h3>
    <div class="row">
      <div class="field">
        <label>PLACA</label>
        <span>${mdfe.placaVeiculo}</span>
      </div>
      <div class="field">
        <label>RENAVAM</label>
        <span>${mdfe.renavam || '-'}</span>
      </div>
      <div class="field">
        <label>CAPACIDADE (KG)</label>
        <span>${mdfe.capKg || '-'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>MOTORISTA</h3>
    <div class="row">
      <div class="field">
        <label>NOME</label>
        <span>${mdfe.nomeMotorista}</span>
      </div>
      <div class="field">
        <label>CPF</label>
        <span>${mdfe.cpfMotorista}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>DOCUMENTOS VINCULADOS</h3>
    <div class="docs">
      <table>
        <tr>
          <th>Tipo</th>
          <th>Chave de Acesso</th>
        </tr>
        ${(mdfe.documentos as any[])
          .map(
            (doc) => `
          <tr>
            <td>${doc.tpDoc === '1' ? 'NFe' : 'CTe'}</td>
            <td style="font-family: monospace; font-size: 10px;">${doc.chNFe}</td>
          </tr>
        `,
          )
          .join('')}
      </table>
    </div>
  </div>

  <div class="section">
    <h3>TOTAIS</h3>
    <div class="row">
      <div class="field">
        <label>QTD NFe</label>
        <span>${mdfe.qNFe}</span>
      </div>
      <div class="field">
        <label>QTD CTe</label>
        <span>${mdfe.qCTe}</span>
      </div>
      <div class="field">
        <label>VALOR CARGA</label>
        <span>R$ ${Number(mdfe.vCarga).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais</p>
    <p>Ambiente: HOMOLOGAÇÃO (Mock)</p>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${accessKey}-damdfe.html"`,
    );
    res.send(htmlDamdfe);
  }

  /**
   * Download XML do MDFe
   */
  @Get('xml/:accessKey')
  async downloadXml(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const mdfe = await this.prisma.mdfe.findFirst({
      where: { accessKey },
    });

    if (!mdfe) {
      throw new NotFoundException('MDFe não encontrado');
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mdfeProc xmlns="http://www.portalfiscal.inf.br/mdfe" versao="3.00">
  <MDFe>
    <infMDFe Id="MDFe${accessKey}" versao="3.00">
      <ide>
        <cUF>35</cUF>
        <mod>58</mod>
        <serie>${mdfe.series}</serie>
        <nMDF>${mdfe.number}</nMDF>
        <dhEmi>${new Date(mdfe.createdAt).toISOString()}</dhEmi>
        <tpAmb>2</tpAmb>
        <UFIni>${mdfe.ufStart}</UFIni>
        <UFFim>${mdfe.ufEnd}</UFFim>
      </ide>
      <emit>
        <CNPJ>00000000000000</CNPJ>
      </emit>
      <infModal>
        <veicTracao>
          <placa>${mdfe.placaVeiculo}</placa>
          <condutor>
            <CPF>${mdfe.cpfMotorista}</CPF>
            <xNome>${mdfe.nomeMotorista}</xNome>
          </condutor>
        </veicTracao>
      </infModal>
      <tot>
        <qNFe>${mdfe.qNFe}</qNFe>
        <qCTe>${mdfe.qCTe}</qCTe>
        <vCarga>${Number(mdfe.vCarga).toFixed(2)}</vCarga>
      </tot>
    </infMDFe>
  </MDFe>
  <protMDFe>
    <nProt>000000000000000</nProt>
    <dhRecbto>${new Date().toISOString()}</dhRecbto>
    <cStat>100</cStat>
    <xMotivo>Autorizado o uso do MDF-e (Mock)</xMotivo>
  </protMDFe>
</mdfeProc>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${accessKey}-mdfe.xml"`,
    );
    res.send(xmlContent);
  }

  /**
   * Encerrar MDFe
   */
  @Post(':accessKey/encerrar')
  @UseGuards(ApiKeyGuard)
  async encerrar(
    @Param('accessKey') accessKey: string,
    @Body('ufEncerramento') ufEncerramento: string,
    @Request() req: any,
  ) {
    const partner = req.partner;

    const issuer = await this.prisma.issuer.findFirst({
      where: { partnerId: partner.id },
    });

    if (!issuer) {
      throw new ForbiddenException('Emissor não encontrado');
    }

    return this.mdfeService.encerrar(accessKey, ufEncerramento, issuer.id);
  }

  /**
   * Buscar MDFe por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mdfeService.findOne(id);
  }
}
