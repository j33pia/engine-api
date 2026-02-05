import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { CryptoUtil } from '../common/utils/crypto.util';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) { }

  async consultCnpj(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao consultar CNPJ: ' + (error.response?.data?.message || error.message));
    }
  }

  // Create Tenant (Issuer) linked to Partner
  async create(createCompanyDto: any, partnerId: string) {
    // Validação simples de duplicidade
    const existing = await this.prisma.issuer.findUnique({
      where: { cnpj: createCompanyDto.cnpj }
    });

    if (existing) {
      throw new Error("CNPJ já cadastrado.");
    }

    return await this.prisma.issuer.create({
      data: {
        name: createCompanyDto.name,
        cnpj: createCompanyDto.cnpj,
        tradeName: createCompanyDto.tradeName,
        email: createCompanyDto.email,
        phone: createCompanyDto.phone,
        partnerId: partnerId, // Linked to authenticated Partner

        // Address (Flattened directly from DTO)
        cep: createCompanyDto.cep,
        address: createCompanyDto.address,
        number: createCompanyDto.number,
        complement: createCompanyDto.complement,
        neighborhood: createCompanyDto.neighborhood,
        city: createCompanyDto.city,
        state: createCompanyDto.state,
        ibgeCode: createCompanyDto.ibgeCode,
        crt: createCompanyDto.crt,
        ie: createCompanyDto.ie,
        im: createCompanyDto.im,
      }
    });
  }

  // List only Issuers for this Partner
  async findAll(partnerId: string) {
    return this.prisma.issuer.findMany({
      where: { partnerId }
    });
  }

  async findOne(id: string) {
    return this.prisma.issuer.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.issuer.update({
      where: { id },
      data,
    });
  }

  async uploadCertificate(id: string, file: Express.Multer.File, password: string) {
    // TODO: In a real scenario, use a Vault or encode the password properly.
    // For now, we save it as is to facilitate the POC integration with ACBr.

    // Simulate reading date validity (Mock)
    // In real implementation: openssl pkcs12 -in file.path -info -noout
    const mockExpiry = new Date();
    mockExpiry.setFullYear(mockExpiry.getFullYear() + 1); // 1 Year validity

    const encryptedPassword = await CryptoUtil.encrypt(password);

    return this.prisma.issuer.update({
      where: { id },
      data: {
        certFilename: file.path,
        certPassword: encryptedPassword,
        certExpiry: mockExpiry,
      }
    });
  }

  async remove(id: string) {
    return this.prisma.issuer.delete({ where: { id } });
  }
}
