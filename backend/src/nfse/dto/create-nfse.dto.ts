import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnderecoDto {
  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  logradouro: string;

  @ApiProperty({ example: '123' })
  @IsString()
  numero: string;

  @ApiPropertyOptional({ example: 'Sala 1' })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  bairro: string;

  @ApiProperty({ example: '3550308' })
  @IsString()
  codigoMunicipio: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  uf: string;

  @ApiProperty({ example: '01310100' })
  @IsString()
  cep: string;
}

export class TomadorDto {
  @ApiProperty({ example: '12345678000190' })
  @IsString()
  cnpjCpf: string;

  @ApiProperty({ example: 'Empresa Tomadora LTDA' })
  @IsString()
  razaoSocial: string;

  @ApiPropertyOptional({ example: 'tomador@empresa.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco: EnderecoDto;
}

export class ServicoDto {
  @ApiProperty({
    example: '3550308',
    description: 'Código IBGE do município de prestação',
  })
  @IsString()
  codigoMunicipio: string;

  @ApiProperty({
    example: '1.01',
    description: 'Item da Lista de Serviços LC 116/2003',
  })
  @IsString()
  itemListaServico: string;

  @ApiProperty({ example: '6311900', description: 'Código CNAE' })
  @IsString()
  @IsOptional()
  codigoCnae?: string;

  @ApiProperty({
    example: 'Desenvolvimento de software conforme contrato 123/2026',
  })
  @IsString()
  discriminacao: string;

  @ApiProperty({ example: 10000.0 })
  @IsNumber()
  valorServicos: number;

  @ApiPropertyOptional({
    example: 0.05,
    description: 'Alíquota ISS (ex: 0.05 = 5%)',
  })
  @IsNumber()
  @IsOptional()
  aliquotaIss?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  valorDeducoes?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  descontoIncondicionado?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  descontoCondicionado?: number;
}

export class CreateNfseDto {
  @ApiProperty({ example: 'uuid-issuer-id' })
  @IsString()
  issuerId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TomadorDto)
  tomador: TomadorDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ServicoDto)
  servico: ServicoDto;
}
