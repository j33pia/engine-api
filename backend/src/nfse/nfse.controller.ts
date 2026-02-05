import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { NfseService } from './nfse.service';
import { CreateNfseDto } from './dto/create-nfse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('🧾 NFSe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nfse')
export class NfseController {
  constructor(private readonly nfseService: NfseService) {}

  @Post()
  @ApiOperation({
    summary: 'Emitir NFSe',
    description: 'Emite uma Nota Fiscal de Serviço Eletrônica',
  })
  @ApiResponse({ status: 201, description: 'NFSe emitida com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na emissão',
  })
  async emit(@Body() dto: CreateNfseDto, @Request() req: any) {
    return this.nfseService.emitNfse(dto, req.user.partnerId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar NFSes',
    description: 'Lista todas as NFSes do parceiro',
  })
  @ApiResponse({ status: 200, description: 'Lista de NFSes' })
  @ApiQuery({
    name: 'issuerId',
    required: false,
    description: 'Filtrar por empresa',
  })
  async list(@Request() req: any, @Query('issuerId') issuerId?: string) {
    if (issuerId) {
      return this.nfseService.listNfses(issuerId, req.user.partnerId);
    }
    return this.nfseService.listAllNfses(req.user.partnerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhes da NFSe',
    description: 'Retorna detalhes de uma NFSe específica',
  })
  @ApiParam({ name: 'id', description: 'ID da NFSe' })
  @ApiResponse({ status: 200, description: 'Detalhes da NFSe' })
  @ApiResponse({ status: 404, description: 'NFSe não encontrada' })
  async getById(@Param('id') id: string, @Request() req: any) {
    return this.nfseService.getNfseById(id, req.user.partnerId);
  }

  @Post(':id/cancelar')
  @ApiOperation({
    summary: 'Cancelar NFSe',
    description: 'Cancela uma NFSe autorizada',
  })
  @ApiParam({ name: 'id', description: 'ID da NFSe' })
  @ApiResponse({ status: 200, description: 'NFSe cancelada' })
  @ApiResponse({ status: 400, description: 'Erro ao cancelar' })
  async cancel(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.nfseService.cancelNfse(id, motivo, req.user.partnerId);
  }

  @Get('pdf/:id')
  @ApiOperation({
    summary: 'Download PDF',
    description: 'Gera e retorna o PDF da NFSe',
  })
  @ApiParam({ name: 'id', description: 'ID da NFSe' })
  @ApiResponse({ status: 200, description: 'PDF da NFSe' })
  async downloadPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const pdf = await this.nfseService.downloadPdf(id, req.user.partnerId);

    if (typeof pdf === 'string') {
      // HTML mock
      res.setHeader('Content-Type', 'text/html');
      return res.send(pdf);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="nfse-${id}.pdf"`);
    return res.send(pdf);
  }

  @Get('xml/:id')
  @ApiOperation({
    summary: 'Download XML',
    description: 'Retorna o XML da NFSe',
  })
  @ApiParam({ name: 'id', description: 'ID da NFSe' })
  @ApiResponse({ status: 200, description: 'XML da NFSe' })
  async downloadXml(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const xml = await this.nfseService.downloadXml(id, req.user.partnerId);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `inline; filename="nfse-${id}.xml"`);
    return res.send(xml);
  }
}
