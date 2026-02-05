import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NfeIniBuilder {
  private readonly logger = new Logger(NfeIniBuilder.name);

  /**
   * Converte dados JSON da NFe para formato INI esperado pela ACBrLib
   * Baseado na documentação oficial: https://acbr.sourceforge.io/ACBrLib/ModeloNFeINI.html
   */
  buildNFeINI(data: any, issuer: any): string {
    const now = new Date();
    const dhEmi = now.toISOString();

    // Gera código único para a NFe
    const cNF = Math.floor(Math.random() * 99999999);

    const ini = `[infNFe]
versao=4.00

[Identificacao]
cNF=${cNF}
natOp=${data.naturezaOperacao || 'Venda de Mercadoria'}
mod=55
serie=${data.serie || 1}
nNF=${data.numero || 1}
dhEmi=${dhEmi}
tpNF=1
idDest=1
tpAmb=${process.env.NFE_AMBIENTE || '2'}
tpImp=1
tpEmis=1
finNFe=1
indFinal=${data.consumidorFinal ? '1' : '0'}
indPres=1
procEmi=0
verProc=NFe Engine v1.0

[Emitente]
CRT=${issuer.crt || 1}
CNPJCPF=${issuer.cnpj}
xNome=${issuer.name}
xFant=${issuer.tradeName || issuer.name}
IE=${issuer.ie || ''}
IM=${issuer.im || ''}
xLgr=${issuer.address || ''}
nro=${issuer.number || 'SN'}
xBairro=${issuer.neighborhood || ''}
cMun=${issuer.ibgeCode || ''}
xMun=${issuer.city || ''}
UF=${issuer.state || ''}
CEP=${issuer.cep || ''}
cPais=1058
xPais=BRASIL
Fone=${issuer.phone || ''}

[Destinatario]
${data.destinatario.cpf ? `CNPJCPF=${data.destinatario.cpf}` : `CNPJCPF=${data.destinatario.cnpj}`}
xNome=${data.destinatario.nome}
indIEDest=9
${data.destinatario.endereco ? this.buildEnderecoDestinatario(data.destinatario.endereco) : ''}

${this.buildProdutos(data.items || data.produtos || [])}

${this.buildTotais(data)}

${this.buildPagamento(data)}

[DadosAdicionais]
infCpl=${data.informacoesComplementares || 'Nota Fiscal emitida via NFe Engine'}
`;

    return ini;
  }

  private buildEnderecoDestinatario(endereco: any): string {
    return `xLgr=${endereco.logradouro || ''}
nro=${endereco.numero || 'SN'}
xBairro=${endereco.bairro || ''}
cMun=${endereco.codigoMunicipio || ''}
xMun=${endereco.municipio || ''}
UF=${endereco.uf || ''}
CEP=${endereco.cep || ''}
cPais=1058
xPais=BRASIL`;
  }

  private buildProdutos(items: any[]): string {
    return items
      .map((item, index) => {
        const idx = String(index + 1).padStart(3, '0');

        return `[Produto${idx}]
cProd=${item.codigo || String(index + 1)}
cEAN=${item.ean || 'SEM GTIN'}
xProd=${item.descricao || item.description}
NCM=${item.ncm || '00000000'}
CFOP=${item.cfop || '5102'}
uCom=${item.unidade || 'UN'}
qCom=${item.quantidade || item.quantity || 1}
vUnCom=${item.valorUnitario || item.unitPrice || 0}
vProd=${(item.quantidade || 1) * (item.valorUnitario || item.unitPrice || 0)}
uTrib=${item.unidade || 'UN'}
qTrib=${item.quantidade || item.quantity || 1}
vUnTrib=${item.valorUnitario || item.unitPrice || 0}
indTot=1
cEANTrib=SEM GTIN

[ICMS${idx}]
orig=0
CSOSN=${item.csosn || '102'}

[PIS${idx}]
CST=${item.cstPIS || '99'}
vBC=0.00
pPIS=0.00
vPIS=0.00

[COFINS${idx}]
CST=${item.cstCOFINS || '99'}
vBC=0.00
pCOFINS=0.00
vCOFINS=0.00
`;
      })
      .join('\n');
  }

  private buildTotais(data: any): string {
    const items = data.items || data.produtos || [];
    const vProd = items.reduce((sum: number, item: any) => {
      return (
        sum +
        (item.quantidade || item.quantity || 1) *
          (item.valorUnitario || item.unitPrice || 0)
      );
    }, 0);

    return `[Total]
vBC=0.00
vICMS=0.00
vBCST=0.00
vST=0.00
vProd=${vProd.toFixed(2)}
vFrete=0.00
vSeg=0.00
vDesc=0.00
vII=0.00
vIPI=0.00
vPIS=0.00
vCOFINS=0.00
vOutro=0.00
vNF=${vProd.toFixed(2)}`;
  }

  private buildPagamento(data: any): string {
    const items = data.items || data.produtos || [];
    const vPag = items.reduce((sum: number, item: any) => {
      return (
        sum +
        (item.quantidade || item.quantity || 1) *
          (item.valorUnitario || item.unitPrice || 0)
      );
    }, 0);

    return `[pag001]
tPag=${data.formaPagamento || '01'}
vPag=${vPag.toFixed(2)}`;
  }
}
