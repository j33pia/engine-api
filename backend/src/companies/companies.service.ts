import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { CryptoUtil } from '../common/utils/crypto.util';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private prisma: PrismaService) {}

  async consultCnpj(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    try {
      const response = await axios.get(
        `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        'Erro ao consultar CNPJ: ' +
          (error.response?.data?.message || error.message),
      );
    }
  }

  // Create Tenant (Issuer) linked to Partner
  async create(createCompanyDto: any, partnerId: string) {
    // Validação simples de duplicidade
    const existing = await this.prisma.issuer.findUnique({
      where: { cnpj: createCompanyDto.cnpj },
    });

    if (existing) {
      throw new Error('CNPJ já cadastrado.');
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
      },
    });
  }

  // List only Issuers for this Partner
  async findAll(partnerId: string) {
    return this.prisma.issuer.findMany({
      where: { partnerId },
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

  async uploadCertificate(
    id: string,
    file: Express.Multer.File,
    password: string,
  ) {
    // First validate that the password is correct
    await this.validateCertificatePassword(file.path, password);

    // Read real certificate expiry date using openssl
    const certExpiry = await this.extractCertificateExpiry(file.path, password);

    const encryptedPassword = await CryptoUtil.encrypt(password);

    return this.prisma.issuer.update({
      where: { id },
      data: {
        certFilename: file.path,
        certPassword: encryptedPassword,
        certExpiry,
      },
    });
  }

  /**
   * Validate certificate password before proceeding
   * Throws BadRequestException if password is incorrect
   */
  private async validateCertificatePassword(
    filePath: string,
    password: string,
  ): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Try to open the certificate with the provided password
      // -info -noout just outputs info without extracting anything
      const command = `openssl pkcs12 -in "${filePath}" -info -noout -passin pass:"${password}" 2>&1`;
      await execAsync(command);
      this.logger.log('Certificate password validated successfully');
    } catch (error: any) {
      // Check if it's a password error
      const errorOutput = error.stderr || error.message || '';
      if (
        errorOutput.includes('invalid password') ||
        errorOutput.includes('mac verify failure') ||
        errorOutput.includes('PKCS12 routines')
      ) {
        this.logger.warn(`Invalid certificate password for file ${filePath}`);
        const { BadRequestException } = await import('@nestjs/common');
        throw new BadRequestException('Senha do certificado inválida');
      }

      // Other errors (file not found, corrupted, etc.)
      this.logger.error(`Certificate validation error: ${error.message}`);
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException(
        'Arquivo de certificado inválido ou corrompido',
      );
    }
  }

  /**
   * Extract certificate expiry date from PFX file using OpenSSL
   * Uses: openssl pkcs12 -in file.pfx -clcerts -nokeys -passin pass:XXX | openssl x509 -noout -enddate
   */
  private async extractCertificateExpiry(
    filePath: string,
    password: string,
  ): Promise<Date> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Extract certificate and get end date
      // -clcerts: only output client certificates (not CA)
      // -nokeys: don't output private keys
      const command = `openssl pkcs12 -in "${filePath}" -clcerts -nokeys -passin pass:"${password}" 2>/dev/null | openssl x509 -noout -enddate`;

      const { stdout } = await execAsync(command);

      // Output format: notAfter=Feb  5 12:00:00 2027 GMT
      const match = stdout.match(/notAfter=(.+)/);
      if (match && match[1]) {
        const dateStr = match[1].trim();
        const expiryDate = new Date(dateStr);

        if (!isNaN(expiryDate.getTime())) {
          this.logger.log(
            `Certificate expiry extracted: ${expiryDate.toISOString()}`,
          );
          return expiryDate;
        }
      }

      throw new Error('Could not parse certificate expiry date');
    } catch (error) {
      this.logger.warn(
        `Failed to extract certificate expiry: ${error.message}. Using fallback +1 year.`,
      );
      // Fallback: 1 year from now
      const fallbackExpiry = new Date();
      fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 1);
      return fallbackExpiry;
    }
  }

  async remove(id: string) {
    return this.prisma.issuer.delete({ where: { id } });
  }
}
