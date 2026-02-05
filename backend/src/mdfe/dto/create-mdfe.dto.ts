import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentoVinculadoDto {
  @IsString()
  chNFe: string; // Chave de acesso do documento

  @IsString()
  tpDoc: string; // 1=NFe, 2=CTe
}

export class CreateMdfeDto {
  @IsOptional()
  @IsNumber()
  series?: number;

  @IsString()
  ufStart: string; // UF de início (SP, MG, RJ...)

  @IsString()
  ufEnd: string; // UF de destino

  @IsDateString()
  dtViagem: string; // Data/hora início viagem (ISO)

  // Veículo
  @IsString()
  placaVeiculo: string;

  @IsOptional()
  @IsString()
  renavam?: string;

  @IsOptional()
  @IsNumber()
  tara?: number; // Peso veículo vazio (kg)

  @IsOptional()
  @IsNumber()
  capKg?: number; // Capacidade em KG

  @IsOptional()
  @IsNumber()
  capM3?: number; // Capacidade em M3

  // Motorista
  @IsString()
  cpfMotorista: string;

  @IsString()
  nomeMotorista: string;

  // Documentos vinculados
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentoVinculadoDto)
  documentos: DocumentoVinculadoDto[];

  // Valor total da carga (opcional)
  @IsOptional()
  @IsNumber()
  vCarga?: number;
}
