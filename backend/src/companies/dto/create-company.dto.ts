import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEmail, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCompanyDto {
  @ApiProperty({ example: '12345678000190' })
  @IsString()
  @Transform(({ value }) => value?.replace(/\D/g, '')) // Remove non-digits
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter exatamente 14 dígitos' })
  cnpj: string;

  @ApiProperty({ example: 'Minha Empresa LTDA' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Loja do João', required: false })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ie?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  im?: string;

  @ApiProperty({
    example: 1,
    description: '1=Simples, 2=Simples Sublimite, 3=Normal',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  crt?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'GO', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ibgeCode?: string;
}
