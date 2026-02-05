import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
    @ApiProperty({ example: 'PROD01' })
    @IsString()
    code: string;

    @ApiProperty({ example: 'Pao Frances' })
    @IsString()
    description: string;

    @ApiProperty({ example: '7891234567890', required: false })
    @IsOptional()
    @IsString()
    ean?: string;

    @ApiProperty({ example: '19059090', required: false })
    @IsOptional()
    @IsString()
    ncm?: string;

    @ApiProperty({ example: 10 })
    @IsNumber()
    @Min(0.01)
    quantity: number;

    @ApiProperty({ example: 0.50 })
    @IsNumber()
    @Min(0.01)
    unitPrice: number;
}

export class CreateNfeDto {
    @ApiProperty({ example: 150.00, description: 'Valor Total da Nota' })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: '12345678000199', description: 'CNPJ do Destinatário' })
    @IsString()
    @Length(11, 14) // Accepts CPF (11) or CNPJ (14)
    destCNPJ: string;

    @ApiProperty({ example: 'Cliente Exemplo LTDA', description: 'Nome do Destinatário' })
    @IsString()
    destName: string;

    @ApiProperty({ example: '55', description: 'Modelo (55=NFe, 65=NFCe)', required: false })
    @IsOptional()
    @IsEnum(['55', '65'])
    model?: '55' | '65';

    @ApiProperty({ type: [InvoiceItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items?: InvoiceItemDto[];
}
