import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class NfceItemDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  ean?: string;

  @IsString()
  @IsOptional()
  ncm?: string;

  @IsString()
  @IsOptional()
  cfop?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unitPrice: number;
}

export class CreateNfceDto {
  // Série da NFCe (geralmente 1)
  @IsNumber()
  @IsOptional()
  series?: number;

  // Número da nota (auto-increment se não informado)
  @IsNumber()
  @IsOptional()
  number?: number;

  // Destinatário (opcional para NFCe)
  @IsString()
  @IsOptional()
  destCPF?: string;

  @IsString()
  @IsOptional()
  destName?: string;

  // Itens da venda
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NfceItemDto)
  items: NfceItemDto[];

  // Forma de pagamento
  @IsString()
  @IsOptional()
  paymentType?: string; // 01=Dinheiro, 03=Cartão Crédito, 04=Cartão Débito, 05=PIX

  @IsNumber()
  @IsOptional()
  paymentValue?: number;

  // Informações adicionais
  @IsString()
  @IsOptional()
  infAdic?: string;
}
