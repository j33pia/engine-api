# Dataset Técnico Mestre ACBrLib para Treinamento de IA

Este documento contém a especificação técnica exaustiva da ACBrLib, projetada para fornecer a um agente de IA todo o conhecimento necessário para desenvolver integrações completas.

---

## 1. Arquitetura e Inicialização

A ACBrLib é uma biblioteca (DLL/SO) que expõe métodos via Cdecl ou StdCall.

### 1.1. Métodos Base (Comuns a todos os módulos)
- `[MODULO]_Inicializar(eArqConfig, eChaveCrypt)`
  - `eArqConfig`: Caminho para o arquivo .ini de configuração. Se vazio, cria `ACBrLib.ini` na pasta do executável.
  - `eChaveCrypt`: Chave opcional para criptografar dados sensíveis no INI.
- `[MODULO]_Finalizar()`
  - Encerra a instância da biblioteca e libera memória.
- `[MODULO]_ConfigLer(eArqConfig)`
  - Lê configurações de um arquivo específico.
- `[MODULO]_ConfigGravar(eArqConfig)`
  - Grava as configurações atuais no arquivo.
- `[MODULO]_ConfigLerValor(eSessao, eChave, sValor, esTamanho)`
  - Lê um valor específico do INI em memória.
- `[MODULO]_ConfigGravarValor(eSessao, eChave, eValor)`
  - Altera um valor de configuração em memória.

---

## 2. Módulo NFe / NFCe (ACBrLibNFe)

### 2.1. Métodos Principais de Operação
| Método | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `NFE_CarregarINI(eArquivoINI)` | `eArquivoINI`: Conteúdo ou caminho do arquivo INI da nota. | Carrega os dados da nota para a memória. |
| `NFE_Assinar()` | (Nenhum) | Assina as notas carregadas usando o certificado configurado. |
| `NFE_Validar()` | (Nenhum) | Valida o XML contra os Schemas da SEFAZ. |
| `NFE_Enviar(ALote, AImprimir, ASincrono, AZipado, sResposta, esTamanho)` | `ALote`: Int, `AImprimir`: Bool, `ASincrono`: Bool, `AZipado`: Bool | Envia o lote para a SEFAZ. Retorna resposta detalhada em `sResposta`. |
| `NFE_Cancelar(eChave, eJustificativa, eCNPJ, ALote, sResposta, esTamanho)` | `eChave`: Chave da nota, `eJustificativa`: Min 15 chars. | Realiza o cancelamento da nota. |
| `NFE_Imprimir(cNomeImpressora, nNumCopias, cProtocolo, bMostrarPreview, cMarcaDagua, bViaConsumidor, bSimplificado)` | Diversos parâmetros de controle de impressão. | Imprime o DANFe/DANFCe. |

### 2.2. Estrutura do Arquivo NFe.INI (Campos Críticos)
O arquivo INI segue a estrutura da SEFAZ, mas com grupos específicos do ACBr:
- `[infNFe]`: `versao=4.00`
- `[Identificacao]`: `cNF`, `natOp`, `mod` (55=NFe, 65=NFCe), `serie`, `nNF`, `tpAmb` (1=Prod, 2=Homol).
- `[Emitente]`: `CNPJCPF`, `xNome`, `IE`, `CRT` (1=Simples, 3=Normal).
- `[Destinatario]`: `CNPJCPF`, `xNome`, `indIEDest`.
- `[Produto001]`: `cProd`, `xProd`, `NCM`, `CFOP`, `uCom`, `qCom`, `vUnCom`, `vProd`.
- `[ICMS001]`: `Orig`, `CST` ou `CSOSN`, `vBC`, `pICMS`, `vICMS`.

---

## 3. Módulo Boleto (ACBrLibBoleto)

### 3.1. Métodos de Operação
- `BOLETO_ConfigurarDados(eArquivoINI, sResposta, esTamanho)`
  - Configura os dados do Cedente e do Banco (usando `Cedente.INI`).
- `BOLETO_IncluirTitulos(eArquivoINI, eModoImpressao, sResposta, esTamanho)`
  - Adiciona títulos à lista (usando `Titulos.INI`).
- `BOLETO_GerarRemessa(eDir, nNumRemessa, eNomeArq)`
  - Gera o arquivo de remessa para o banco.
- `BOLETO_LerRetorno(eDir, eNomeArq)`
  - Processa o arquivo de retorno do banco.

### 3.2. Configuração do Cedente (Cedente.INI)
- `[Cedente]`: `Nome`, `CNPJCPF`, `Logradouro`, `Numero`, `Bairro`, `Cidade`, `UF`, `CEP`.
- `[Conta]`: `Conta`, `DigitoConta`, `Agencia`, `DigitoAgencia`.
- `[Banco]`: `Numero`, `CNPJ`, `Nome`, `Carteira`, `TipoCarteira`.

---

## 4. Configurações Globais (ACBrLib.ini)

Essas chaves devem ser conhecidas pelo agente para configurar o ambiente:

### 4.1. Grupo [Principal]
- `TipoResposta`: 0=INI, 1=XML, 2=JSON. (Recomendado: 2 para agentes de IA).
- `Codificacao`: 0=UTF8, 1=ANSI.

### 4.2. Grupo [DFe]
- `SSLLib`: 0=libNone, 1=libOpenSSL, 2=libCapicom, 3=libMSXML.
- `TipoCertificado`: 0=A1, 1=A3.
- `ArquivoPFX`: Caminho para o certificado A1.
- `Senha`: Senha do certificado.

### 4.3. Grupo [Email]
- `Host`, `Port`, `User`, `Pass`, `SSL`, `TLS`.

---

## 5. Códigos de Retorno e Erros
- `0`: Sucesso.
- `-1`: Biblioteca não inicializada.
- `-10`: Erro de validação de parâmetros.
- `-11`: Erro de validação de XML/Schemas.
- `> 0`: Geralmente indica o tamanho da string de resposta quando o buffer é insuficiente.

---

## 6. Dicas para o Agente de IA
1. **Sempre verifique o `CStat`**: No retorno do envio da NFe, o sucesso da biblioteca (retorno 0) significa que o comando foi executado, mas a nota só é válida se `CStat=100`.
2. **Tratamento de Strings**: A biblioteca usa buffers. Sempre passe um tamanho de buffer adequado (ex: 256KB para XMLs) e verifique se o retorno solicita um buffer maior.
3. **Modo de Resposta**: Configure `TipoResposta=2` (JSON) logo após o `Inicializar` para facilitar o parsing dos dados pela IA.

---

## 7. Configurações Detalhadas por Módulo

### 7.1. Configurações NFe/NFCe ([NFe])
| Chave | Valores Possíveis | Descrição |
| :--- | :--- | :--- |
| `FormaEmissao` | 0=Normal, 1=Contingência, 8=OffLine (NFCe) | Define o modo de operação. |
| `ModeloDF` | 0=moNFe (55), 1=moNFCe (65) | Define o tipo de documento. |
| `VersaoDF` | 0=2.00, 1=3.00, 2=3.10, 3=4.00 | Versão do layout SEFAZ. |
| `Ambiente` | 0=Produção, 1=Homologação | **Crítico**: Define para onde a nota será enviada. |
| `SSLType` | 0=All, 5=TLSv1.2 (Recomendado) | Tipo de conexão segura. |
| `IdCSC` / `CSC` | String | Obrigatórios para NFCe (Token e ID do Token). |

### 7.2. Configurações de Impressão ([DANFE])
- `PathPDF`: Caminho para salvar os PDFs gerados.
- `Impressora`: Nome da impressora (se vazio, usa a padrão).
- `MostraPreview`: 0=Não, 1=Sim (Útil para depuração).
- `TipoDANFE`: 1=Retrato, 2=Paisagem, 4=NFCe.

---

## 8. Fluxo de Implementação Recomendado para IA

Para que seu agente desenvolva com sucesso, ele deve seguir este algoritmo:

1.  **Inicialização**: Chamar `NFE_Inicializar`.
2.  **Configuração**:
    - Usar `NFE_ConfigGravarValor("NFe", "Ambiente", "1")` para homologação.
    - Configurar certificado em `[DFe]`.
    - Configurar `TipoResposta=2` (JSON).
3.  **Carga de Dados**: Gerar um arquivo INI temporário com os dados da venda e chamar `NFE_CarregarINI`.
4.  **Processamento**:
    - `NFE_Assinar`
    - `NFE_Validar`
5.  **Envio**: Chamar `NFE_Enviar`.
6.  **Parsing da Resposta**: Ler o JSON retornado em `sResposta`.
    - Se `CStat == 100`: Sucesso. Salvar XML e imprimir PDF (`NFE_ImprimirPDF`).
    - Se `CStat` indica erro (ex: 204, 539): Tratar conforme a regra de negócio.
7.  **Finalização**: Chamar `NFE_Finalizar` ao fechar o sistema.

---

## 9. Modelos de Arquivos INI Completos

### 9.1. Exemplo de Resposta JSON (Sucesso)
```json
{
  "Envio": {
    "CStat": 103,
    "XMotivo": "Lote recebido com sucesso",
    "NRec": "35000000XXXXXXX"
  },
  "Retorno": {
    "CStat": 100,
    "XMotivo": "Autorizado o uso da NF-e",
    "ChDFe": "350XXXXXXXXXXXXXXXXX550010000000280000000281",
    "NProt": "13509000XXXXXXX"
  }
}
```
