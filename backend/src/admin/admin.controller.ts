import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/superadmin.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Obter métricas globais' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  // ============ PARCEIROS ============

  @Get('partners')
  @ApiOperation({ summary: 'Listar todos os parceiros' })
  async listPartners(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listPartners(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Obter detalhes do parceiro' })
  async getPartnerDetails(@Param('id') id: string) {
    const partner = await this.adminService.getPartnerDetails(id);
    if (!partner) {
      throw new NotFoundException('Parceiro não encontrado');
    }
    return partner;
  }

  @Post('partners')
  @ApiOperation({ summary: 'Criar novo parceiro' })
  async createPartner(
    @Body() body: { name: string; cnpj?: string; email?: string },
  ) {
    return this.adminService.createPartner(body);
  }

  @Patch('partners/:id')
  @ApiOperation({ summary: 'Atualizar dados do parceiro' })
  async updatePartner(
    @Param('id') id: string,
    @Body()
    body: { name?: string; cnpj?: string; email?: string; phone?: string },
  ) {
    return this.adminService.updatePartner(id, body);
  }

  @Patch('partners/:id/status')
  @ApiOperation({ summary: 'Atualizar status do parceiro (ACTIVE/SUSPENDED)' })
  async updatePartnerStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
  ) {
    return this.adminService.updatePartnerStatus(id, body.status);
  }

  @Delete('partners/:id')
  @ApiOperation({ summary: 'Excluir parceiro (soft delete)' })
  async deletePartner(@Param('id') id: string) {
    return this.adminService.deletePartner(id);
  }

  @Get('partners/:id/usage')
  @ApiOperation({ summary: 'Obter estatísticas de uso do parceiro' })
  async getPartnerUsage(
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    return this.adminService.getPartnerUsage(
      id,
      months ? parseInt(months) : 12,
    );
  }

  @Post('partners/:id/regenerate-api-key')
  @ApiOperation({ summary: 'Regenerar API key do parceiro' })
  async regenerateApiKey(@Param('id') id: string) {
    return this.adminService.regenerateApiKey(id);
  }

  // ============ AUDITORIA ============

  @Get('audit')
  @ApiOperation({ summary: 'Obter logs de auditoria globais' })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('partnerId') partnerId?: string,
    @Query('action') action?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      partnerId,
      action,
      status,
    });
  }
}
