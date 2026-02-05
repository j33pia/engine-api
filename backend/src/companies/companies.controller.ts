import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('🏢 Companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    try {
      const partnerId = req.user.partnerId;
      console.log('=====================================');
      console.log('RAW BODY RECEIVED:', JSON.stringify(body, null, 2));
      console.log('CNPJ VALUE:', body.cnpj);
      console.log('=====================================');

      return await this.companiesService.create(body, partnerId);
    } catch (error) {
      console.error('Error creating company:', error.message);
      throw error;
    }
  }

  @Get('consult/:cnpj')
  consultCnpj(@Param('cnpj') cnpj: string) {
    return this.companiesService.consultCnpj(cnpj);
  }

  @Get()
  findAll(@Request() req: any) {
    const partnerId = req.user.partnerId;
    return this.companiesService.findAll(partnerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/certificates',
        filename: (req, file, cb) => {
          const issuer_id = req.params.id;
          cb(null, `${issuer_id}.pfx`);
        },
      }),
    }),
  )
  @Post(':id/certificate')
  async uploadCertificate(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password: string,
  ) {
    return this.companiesService.uploadCertificate(id, file, password);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
