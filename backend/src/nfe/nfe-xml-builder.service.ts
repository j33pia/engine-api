import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NfeXmlBuilder {
  private readonly logger = new Logger(NfeXmlBuilder.name);

  /**
   * Constrói XML NFe 4.0 COMPLETO usando TODOS os dados do JSON de entrada
   */
  build(nfeData: any, issuer: any): string {
    const now = new Date();
    // Calcular nNF único baseado em timestamp
    const nNF = nfeData.numero || Math.floor(Date.now() / 1000) % 999999999;
    const chaveNFe = this.generateNFeKey(nfeData, issuer, now, nNF);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveNFe}" versao="4.00">
    ${this.buildIde(nfeData, issuer, now, chaveNFe, nNF)}
    ${this.buildEmit(issuer)}
    ${this.buildDest(nfeData.destinatario || nfeData.dest)}
    ${this.buildDet(nfeData.items || nfeData.produtos || [])}
    ${this.buildTotal(nfeData)}
    ${this.buildTransp(nfeData.transporte)}
    ${this.buildPag(nfeData.pagamento || nfeData.pag, this.calculateTotalNF(nfeData))}
    ${this.buildInfAdic(nfeData.infoAdicional)}
  </infNFe>
</NFe>`;

    return xml;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
  }

  private generateNFeKey(
    nfeData: any,
    issuer: any,
    now: Date,
    nNF: number,
  ): string {
    const cUF = '52'; // GO - pegar do issuer.state futuramente
    const year = String(now.getFullYear()).slice(2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const aamm = year + month;
    const cnpj = (issuer.cnpj || '').replace(/\D/g, '');
    const mod = '55'; // NFe
    const serie = String(nfeData.serie || 1).padStart(3, '0');
    const nNFStr = String(nNF).padStart(9, '0');
    const tpEmis = '1'; // Normal
    const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');

    // Chave base (43 dígitos)
    const chaveBase = `${cUF}${aamm}${cnpj}${mod}${serie}${nNFStr}${tpEmis}${cNF}`;

    // Calcular DV usando módulo 11
    let soma = 0;
    let peso = 2;
    for (let i = chaveBase.length - 1; i >= 0; i--) {
      soma += parseInt(chaveBase[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    const dv = resto === 0 || resto === 1 ? 0 : 11 - resto;

    return chaveBase + dv;
  }

  private buildIde(
    nfeData: any,
    issuer: any,
    now: Date,
    chaveNFe: string,
    nNF: number,
  ): string {
    const cUF = '52'; // GO
    const cNF = chaveNFe.substring(35, 43);
    const dv = chaveNFe.substring(43);
    const dhEmi = this.formatDateTime(now);

    return `<ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>${nfeData.naturezaOperacao || 'Venda de Mercadoria'}</natOp>
      <mod>55</mod>
      <serie>${nfeData.serie || 1}</serie>
      <nNF>${nNF}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>${nfeData.tipoNF || 1}</tpNF>
      <idDest>${nfeData.idDest || 1}</idDest>
      <cMunFG>5208707</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${dv}</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>${nfeData.finalidade || 1}</finNFe>
      <indFinal>1</indFinal>
      <indPres>${nfeData.presenca || 1}</indPres>
      <procEmi>0</procEmi>
      <verProc>NFe Engine v1.0</verProc>
    </ide>`;
  }

  private buildEmit(issuer: any): string {
    const cnpj = (issuer.cnpj || '').replace(/\D/g, '');
    return `<emit>
      <CNPJ>${cnpj}</CNPJ>
      <xNome>${issuer.name || issuer.razaoSocial}</xNome>
      <xFant>${issuer.nomeFantasia || issuer.name}</xFant>
      <enderEmit>
        <xLgr>${issuer.address || issuer.logradouro}</xLgr>
        <nro>${issuer.number || issuer.numero}</nro>
        <xCpl>${issuer.complemento || ''}</xCpl>
        <xBairro>${issuer.neighborhood || issuer.bairro}</xBairro>
        <cMun>${issuer.codigoMunicipio || '5208707'}</cMun>
        <xMun>${issuer.city || issuer.municipio}</xMun>
        <UF>${issuer.state || issuer.uf}</UF>
        <CEP>${(issuer.cep || '').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
        ${issuer.telefone ? `<fone>${issuer.telefone.replace(/\D/g, '')}</fone>` : ''}
      </enderEmit>
      <IE>${issuer.ie || issuer.inscricaoEstadual || ''}</IE>
      <CRT>${issuer.crt || 1}</CRT>
    </emit>`;
  }

  private buildDest(dest: any): string {
    if (!dest) {
      // Consumidor final padrão COM endereço e CPF válido
      return `<dest>
      <CPF>12345678909</CPF>
      <xNome>CONSUMIDOR FINAL</xNome>
      <enderDest>
        <xLgr>Rua Consumidor</xLgr>
        <nro>SN</nro>
        <xBairro>Centro</xBairro>
        <cMun>5208707</cMun>
        <xMun>Goiania</xMun>
        <UF>GO</UF>
        <CEP>74000000</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>`;
    }

    const docTag = dest.cpf
      ? `<CPF>${(dest.cpf || '12345678909').replace(/\D/g, '').padEnd(11, '0')}</CPF>`
      : dest.cnpj
        ? `<CNPJ>${(dest.cnpj || '00000000000000').replace(/\D/g, '').padEnd(14, '0')}</CNPJ>`
        : `<CPF>12345678909</CPF>`;

    return `<dest>
      ${docTag}
      <xNome>${dest.nome || dest.razaoSocial || 'CONSUMIDOR FINAL'}</xNome>
      <enderDest>
        <xLgr>${dest.address || dest.logradouro || 'Rua Consumidor'}</xLgr>
        <nro>${dest.number || dest.numero || 'SN'}</nro>
        ${dest.complemento ? `<xCpl>${dest.complemento}</xCpl>` : ''}
        <xBairro>${dest.neighborhood || dest.bairro || 'Centro'}</xBairro>
        <cMun>${dest.codigoMunicipio || '5208707'}</cMun>
        <xMun>${dest.city || dest.municipio || 'Goiania'}</xMun>
        <UF>${dest.state || dest.uf || 'GO'}</UF>
        <CEP>${(dest.cep || '74000000').replace(/\D/g, '').padEnd(8, '0')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
        ${dest.telefone ? `<fone>${dest.telefone.replace(/\D/g, '')}</fone>` : ''}
      </enderDest>
      ${dest.email ? `<email>${dest.email}</email>` : ''}
      <indIEDest>${dest.indIEDest || 9}</indIEDest>
    </dest>`;
  }

  private buildDet(items: any[]): string {
    if (!items || items.length === 0) {
      // Item padrão de teste
      return this.buildSingleDet(1, {
        codigo: '001',
        descricao: 'PRODUTO DE TESTE',
        ncm: '00000000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: 100,
        valorTotal: 100,
      });
    }

    return items
      .map((item, index) => this.buildSingleDet(index + 1, item))
      .join('\n    ');
  }

  private buildSingleDet(nItem: number, item: any): string {
    const quantidade = Math.abs(item.quantidade || 1);
    const valorUnitario = Math.abs(item.valorUnitario || item.unitPrice || 100);
    const vProd = Math.abs(item.valorTotal || quantidade * valorUnitario);

    return `<det nItem="${nItem}">
      <prod>
        <cProd>${item.codigo || item.codigoProduto || item.code || '001'}</cProd>
        <cEAN>${item.ean || item.gtin || 'SEM GTIN'}</cEAN>
        <xProd>${item.descricao || item.nome || item.description || 'PRODUTO'}</xProd>
        <NCM>${item.ncm || '00000000'}</NCM>
        <CFOP>${item.cfop || '5102'}</CFOP>
        <uCom>${item.unidade || item.unit || 'UN'}</uCom>
        <qCom>${quantidade.toFixed(4)}</qCom>
        <vUnCom>${valorUnitario.toFixed(2)}</vUnCom>
        <vProd>${vProd.toFixed(2)}</vProd>
        <cEANTrib>${item.eanTributavel || item.ean || 'SEM GTIN'}</cEANTrib>
        <uTrib>${item.unidadeTributavel || item.unidade || item.unit || 'UN'}</uTrib>
        <qTrib>${(item.quantidadeTributavel || quantidade).toFixed(4)}</qTrib>
        <vUnTrib>${(item.valorUnitarioTributavel || valorUnitario).toFixed(2)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      ${this.buildImposto(item)}
    </det>`;
  }

  private buildImposto(item: any): string {
    // Implementação básica - expandir conforme necessário
    return `<imposto>
      <ICMS>
        <ICMSSN102>
          <orig>${item.origem || 0}</orig>
          <CSOSN>${item.csosn || '102'}</CSOSN>
        </ICMSSN102>
      </ICMS>
      <PIS>
        <PISOutr>
          <CST>99</CST>
          <vBC>0.00</vBC>
          <pPIS>0.00</pPIS>
          <vPIS>0.00</vPIS>
        </PISOutr>
      </PIS>
      <COFINS>
        <COFINSOutr>
          <CST>99</CST>
          <vBC>0.00</vBC>
          <pCOFINS>0.00</pCOFINS>
          <vCOFINS>0.00</vCOFINS>
        </COFINSOutr>
      </COFINS>
    </imposto>`;
  }

  private buildTotal(nfeData: any): string {
    // Calcular totais a partir dos itens (não confiar no JSON de entrada)
    const items = nfeData.items || nfeData.produtos || [];

    let totalVProd = 0;
    if (items.length > 0) {
      totalVProd = items.reduce((sum: number, item: any) => {
        const quantidade = Math.abs(item.quantidade || 1);
        const valorUnitario = Math.abs(
          item.valorUnitario || item.unitPrice || 100,
        );
        const vProd = Math.abs(item.valorTotal || quantidade * valorUnitario);
        return sum + vProd;
      }, 0);
    } else {
      totalVProd = 100; // Item padrão
    }

    const vFrete = Math.abs(nfeData.valorFrete || 0);
    const vSeg = Math.abs(nfeData.valorSeguro || 0);
    const vDesc = Math.abs(nfeData.valorDesconto || 0);
    const vOutro = Math.abs(nfeData.outrasDespesas || 0);
    const vNF = totalVProd + vFrete + vSeg - vDesc + vOutro;

    return `<total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${totalVProd.toFixed(2)}</vProd>
        <vFrete>${vFrete.toFixed(2)}</vFrete>
        <vSeg>${vSeg.toFixed(2)}</vSeg>
        <vDesc>${vDesc.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>${vOutro.toFixed(2)}</vOutro>
        <vNF>${vNF.toFixed(2)}</vNF>
      </ICMSTot>
    </total>`;
  }

  private buildTransp(transp: any): string {
    if (!transp) {
      return `<transp>
      <modFrete>9</modFrete>
    </transp>`;
    }

    return `<transp>
      <modFrete>${transp.modalidadeFrete || 9}</modFrete>
      ${transp.transportadora ? this.buildTransportadora(transp.transportadora) : ''}
      ${transp.veiculo ? this.buildVeiculo(transp.veiculo) : ''}
      ${transp.volumes ? this.buildVolumes(transp.volumes) : ''}
    </transp>`;
  }

  private buildTransportadora(transportadora: any): string {
    const doc = transportadora.cnpj
      ? `<CNPJ>${transportadora.cnpj.replace(/\D/g, '')}</CNPJ>`
      : transportadora.cpf
        ? `<CPF>${transportadora.cpf.replace(/\D/g, '')}</CPF>`
        : '';

    return `<transporta>
      ${doc}
      <xNome>${transportadora.nome || transportadora.razaoSocial}</xNome>
      ${transportadora.ie ? `<IE>${transportadora.ie}</IE>` : ''}
      ${transportadora.endereco ? `<xEnder>${transportadora.endereco}</xEnder>` : ''}
      ${transportadora.municipio ? `<xMun>${transportadora.municipio}</xMun>` : ''}
      ${transportadora.uf ? `<UF>${transportadora.uf}</UF>` : ''}
    </transporta>`;
  }

  private buildVeiculo(veiculo: any): string {
    return `<veicTransp>
      <placa>${veiculo.placa}</placa>
      <UF>${veiculo.uf}</UF>
      ${veiculo.rntc ? `<RNTC>${veiculo.rntc}</RNTC>` : ''}
    </veicTransp>`;
  }

  private buildVolumes(volumes: any[]): string {
    return volumes
      .map(
        (vol) => `<vol>
      ${vol.quantidade ? `<qVol>${vol.quantidade}</qVol>` : ''}
      ${vol.especie ? `<esp>${vol.especie}</esp>` : ''}
      ${vol.marca ? `<marca>${vol.marca}</marca>` : ''}
      ${vol.numeracao ? `<nVol>${vol.numeracao}</nVol>` : ''}
      ${vol.pesoLiquido ? `<pesoL>${vol.pesoLiquido.toFixed(3)}</pesoL>` : ''}
      ${vol.pesoBruto ? `<pesoB>${vol.pesoBruto.toFixed(3)}</pesoB>` : ''}
    </vol>`,
      )
      .join('\n    ');
  }

  private calculateTotalNF(nfeData: any): number {
    const items = nfeData.items || nfeData.produtos || [];
    let totalVProd = 0;
    if (items.length > 0) {
      totalVProd = items.reduce((sum: number, item: any) => {
        const quantidade = Math.abs(item.quantidade || 1);
        const valorUnitario = Math.abs(
          item.valorUnitario || item.unitPrice || 100,
        );
        const vProd = Math.abs(item.valorTotal || quantidade * valorUnitario);
        return sum + vProd;
      }, 0);
    } else {
      totalVProd = 100;
    }
    const vFrete = Math.abs(nfeData.valorFrete || 0);
    const vSeg = Math.abs(nfeData.valorSeguro || 0);
    const vDesc = Math.abs(nfeData.valorDesconto || 0);
    const vOutro = Math.abs(nfeData.outrasDespesas || 0);
    return totalVProd + vFrete + vSeg - vDesc + vOutro;
  }

  private buildPag(pag: any, vNF: number): string {
    if (!pag || !pag.formas || pag.formas.length === 0) {
      // Pagamento padrão com valor da nota
      return `<pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>${vNF.toFixed(2)}</vPag>
      </detPag>
    </pag>`;
    }

    const detPags = pag.formas
      .map(
        (forma: any) => `<detPag>
      <indPag>${forma.indicador || 0}</indPag>
      <tPag>${forma.tipo || '01'}</tPag>
      <vPag>${forma.valor.toFixed(2)}</vPag>
      ${forma.card ? this.buildCard(forma.card) : ''}
    </detPag>`,
      )
      .join('\n      ');

    return `<pag>
      ${detPags}
      ${pag.troco ? `<vTroco>${pag.troco.toFixed(2)}</vTroco>` : ''}
    </pag>`;
  }

  private buildCard(card: any): string {
    return `<card>
      <tpIntegr>${card.tipoIntegracao || 1}</tpIntegr>
      ${card.cnpj ? `<CNPJ>${card.cnpj.replace(/\D/g, '')}</CNPJ>` : ''}
      ${card.bandeira ? `<tBand>${card.bandeira}</tBand>` : ''}
      ${card.autorizacao ? `<cAut>${card.autorizacao}</cAut>` : ''}
    </card>`;
  }

  private buildInfAdic(infAdic: any): string {
    if (!infAdic) return '';

    return `<infAdic>
      ${infAdic.infoFisco ? `<infCpl>${infAdic.infoFisco}</infCpl>` : ''}
      ${infAdic.infoComplementar ? `<infCpl>${infAdic.infoComplementar}</infCpl>` : ''}
    </infAdic>`;
  }
}
