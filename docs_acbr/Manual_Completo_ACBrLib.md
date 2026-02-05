# Manual Completo ACBrLib

Este documento contém a documentação técnica consolidada da ACBrLib, abrangendo os principais módulos e configurações para integração em diversas linguagens de programação.

---

## 1. Informações Gerais e Configurações Base

### 1.1. O que é a ACBrLib?
A ACBrLib é um conjunto de bibliotecas compartilhadas (DLLs no Windows, .SO no Linux) que encapsula os componentes do Projeto ACBr, permitindo seu uso em qualquer linguagem que suporte chamadas a funções de bibliotecas externas (C#, Java, VB, Delphi, PHP, Python, etc.).

### 1.2. Configurações Gerais ([Principal])
- **TipoResposta**: Define o formato do retorno (0=INI, 1=XML, 2=JSON).
- **CodificacaoResposta**: Define a codificação (0=UTF8, 1=ANSI).
- **LogNivel**: Nível de detalhamento do log (0 a 4).
- **LogPath**: Caminho para salvar os arquivos de log.

### 1.3. Configurações de E-mail ([Email])
Permite a configuração de servidor SMTP para envio de documentos (NFe, Boletos, etc.) diretamente pela biblioteca. Suporta SSL/TLS e autenticação.

### 1.4. Configurações DFe ([DFe])
Essencial para módulos que emitem documentos fiscais eletrônicos:
- **ArquivoPFX / NumeroSerie**: Identificação do certificado digital.
- **SSLCryptLib**: Engine de criptografia (OpenSSL, WinCrypt).
- **SSLHttpLib**: API de comunicação (WinInet, WinHttp, OpenSSL).
- **UF**: Sigla do estado do emitente.

---

## 2. Módulo ACBrLibNFe / NFCe

### 2.1. Métodos Principais
- `NFE_CarregarINI(eArquivoOuIni)`: Carrega os dados da nota a partir de um arquivo ou string INI.
- `NFE_Assinar()`: Realiza a assinatura digital do XML.
- `NFE_Validar()`: Valida o XML contra os schemas da SEFAZ.
- `NFE_Enviar(lote, imprimir, sincrono)`: Envia a nota para processamento.
- `NFE_Imprimir()`: Gera o DANFE (impressão ou PDF).

### 2.2. Fluxo de Emissão
1. Limpar lista de notas.
2. Carregar dados (INI ou XML).
3. Assinar e Validar.
4. Enviar para a SEFAZ.
5. Tratar o retorno e imprimir o DANFE.

---

## 3. Módulo ACBrLibBoleto

### 3.1. Funcionalidades
Emissão de boletos, geração de arquivos de remessa (CNAB240/400) e processamento de arquivos de retorno para mais de 30 bancos.

### 3.2. Configurações do Banco ([BoletoBancoConfig])
- **TipoCobranca**: Define o banco (Ex: 1=BB, 2=Santander, 5=Bradesco, 6=Itaú).
- **LocalPagamento**: Texto do local de pagamento.

### 3.3. Configurações do Cedente ([BoletoCedenteConfig])
- **Agencia, Conta, Convenio, CodigoCedente**: Dados bancários da empresa.
- **TipoCarteira**: (0=Simples, 1=Registrada).

### 3.4. Métodos Principais
- `BOLETO_ConfigurarDados(eArquivoOuIni)`: Configura os dados do cedente.
- `BOLETO_IncluirTitulos(eArquivoOuIni, eComando)`: Adiciona títulos à lista.
- `BOLETO_GerarRemessa(eDir, eNomeArq)`: Gera o arquivo para o banco.
- `BOLETO_LerRetorno(eDir, eNomeArq)`: Processa o arquivo vindo do banco.
- `BOLETO_Imprimir()`: Gera o boleto em PDF ou impressora.

---

## 4. Módulo ACBrLibSAT

### 4.1. Funcionalidades
Emissão de Cupom Fiscal Eletrônico (CFe) através de equipamentos SAT (comum no estado de SP).

### 4.2. Métodos Principais
- `SAT_InicializarSAT()`: Estabelece comunicação com o aparelho.
- `SAT_EnviarCFe(eArquivoOuIni)`: Envia os dados da venda para o SAT.
- `SAT_ImprimirExtratoVenda(eArquivoXml)`: Imprime o cupom.
- `SAT_ConsultarStatusOperacional()`: Verifica o estado do equipamento.

---

## 5. Módulo ACBrLibBAL (Balanças)

### 5.1. Funcionalidades
Leitura de peso de balanças comerciais conectadas via serial ou USB.

### 5.2. Métodos Principais
- `BAL_Ativar()`: Ativa a comunicação com a balança.
- `BAL_LePeso()`: Solicita e retorna o peso atual.
- `BAL_Desativar()`: Encerra a comunicação.

---

## 6. Outros Módulos Disponíveis
- **ACBrLibPosPrinter**: Controle de impressoras térmicas (EscPos).
- **ACBrLibGAV**: Controle de gavetas de dinheiro.
- **ACBrLibETQ**: Impressão de etiquetas (ZPL, EPL, PPLA/B).
- **ACBrLibReinf**: Escrituração Fiscal Digital de Retenções.
- **ACBrLibSedex**: Consulta de prazos e preços dos Correios.

---

## 7. Dicas para o Agente de IA
- **Arquivos INI**: A ACBrLib utiliza extensivamente arquivos .INI para troca de dados. Estude os modelos `NFe.INI`, `Cedente.INI` e `Titulos.INI`.
- **Convenção de Chamada**: Verifique se a linguagem utiliza `StdCall` ou `Cdecl`.
- **Arquitetura**: Utilize a DLL correspondente à arquitetura do seu executável (32 ou 64 bits).
- **Tratamento de Erros**: Sempre verifique o código de retorno das funções. Valores negativos geralmente indicam erros, que podem ser detalhados pelo método `UltimoRetorno`.

---

## 8. Recursos Adicionais e Downloads

### 8.1. Binários e Demos
- **ACBr Pro**: Versões completas e atualizadas para assinantes. [Link Pro](https://www.projetoacbr.com.br/forum/files/category/36-acbrlib-pro/)
- **ACBr Demo**: Versões de teste gratuitas. [Link Demo](https://www.projetoacbr.com.br/forum/topic/63052-acbrlib-demo-download-livre/)
- **Exemplos (Demos)**: Repositório SVN com exemplos em diversas linguagens (C#, Java, Python, etc.). [Link SVN Demos](http://svn.code.sf.net/p/acbr/code/trunk2/Projetos/ACBrLib/Demos/)

### 8.2. Suporte e Comunidade
- **Fórum ACBr**: Principal canal de dúvidas e troca de conhecimento. [Fórum](https://www.projetoacbr.com.br/forum/)
- **Fontes**: O código-fonte da ACBrLib está disponível no SVN para consulta e contribuição.

---

## 9. Conclusão para Treinamento de IA
Este manual consolidado fornece a base estrutural para que um agente de IA compreenda a arquitetura da ACBrLib. Para um treinamento eficaz, recomenda-se que o agente analise os arquivos de exemplo (Demos) e os modelos de arquivos INI fornecidos nos links acima, pois eles contêm a aplicação prática de todos os métodos e configurações aqui descritos.
