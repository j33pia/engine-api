import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
  @ApiOperation({ summary: 'Get global overview metrics' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('partners')
  @ApiOperation({ summary: 'List all partners' })
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
  @ApiOperation({ summary: 'Get partner details' })
  async getPartnerDetails(@Param('id') id: string) {
    return this.adminService.getPartnerDetails(id);
  }

  @Post('partners')
  @ApiOperation({ summary: 'Create new partner' })
  async createPartner(
    @Body() body: { name: string; cnpj?: string; email?: string },
  ) {
    return this.adminService.createPartner(body);
  }

  @Patch('partners/:id/status')
  @ApiOperation({ summary: 'Update partner status' })
  async updatePartnerStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
  ) {
    return this.adminService.updatePartnerStatus(id, body.status);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get global audit logs' })
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
