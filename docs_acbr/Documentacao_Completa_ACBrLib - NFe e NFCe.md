# Documentação Completa ACBrLib - NFe e NFCe

Esta documentação técnica detalha os aspectos essenciais para a implementação e utilização da biblioteca ACBrLib na emissão de Nota Fiscal Eletrônica (NFe) e Nota Fiscal de Consumidor Eletrônica (NFCe). O objetivo é fornecer um guia abrangente para desenvolvedores que buscam integrar essas funcionalidades em seus sistemas.

## 1. Introdução à ACBrLib

A ACBrLib é uma biblioteca (DLL/SO) desenvolvida para facilitar a integração de funcionalidades de automação comercial em diversas linguagens de programação. Ela abstrai a complexidade das regras fiscais e da comunicação com os servidores da SEFAZ, permitindo que os desenvolvedores se concentrem na lógica de negócio de suas aplicações.

### 1.1. Como Utilizar a ACBrLib

Para iniciar a utilização da ACBrLib, siga os passos fundamentais descritos abaixo:

1.  **Instalação**: Copie os arquivos da biblioteca (DLL/SO) para o diretório apropriado do seu sistema ou da sua aplicação. Recomenda-se seguir as orientações específicas de instalação e distribuição fornecidas pela ACBr [1].
2.  **Dependências**: Verifique e instale todas as dependências necessárias, como OpenSSL e LibXML2. É crucial que as dependências estejam na mesma arquitetura (32 ou 64 bits) do seu executável, independentemente da arquitetura do sistema operacional [2].
3.  **Inicialização**: Chame o método de inicialização da ACBrLib, por exemplo, `NFE_Inicializar`, para preparar a biblioteca para uso.
4.  **Configuração**: O arquivo de configuração (geralmente `ACBrLib.ini`) será criado automaticamente no primeiro uso, caso não exista. Este arquivo contém as configurações globais e específicas de cada módulo da biblioteca.
5.  **Uso dos Métodos**: Utilize os métodos específicos da ACBrLib para realizar as operações desejadas (emissão, consulta, cancelamento, etc.).
6.  **Finalização**: Ao encerrar o uso da biblioteca, chame o método `NFE_Finalizar` para liberar os recursos alocados.

## 2. Configurações Principais da ACBrLibNFe

As configurações da ACBrLibNFe são gerenciadas através de um arquivo INI, dividido em seções que organizam os parâmetros por funcionalidade. As seções mais relevantes para NFe e NFCe são:

### 2.1. Seção `[NFe]`

Esta seção contém as configurações gerais para a emissão de NFe e NFCe. Abaixo, uma tabela com as chaves mais importantes:

<table header-row="true">
<tr><td>**CHAVE**</td><td>**DESCRIÇÃO**</td><td>**VALORES POSSÍVEIS**</td></tr>
<tr><td>`ModeloDF`</td><td>Define o modelo do Documento Fiscal a ser emitido.</td><td>`0 = moNFe` (NFe), `1 = moNFCe` (NFCe)</td></tr>
<tr><td>`VersaoDF`</td><td>Define a versão do layout do Documento Fiscal.</td><td>`0 = ve200`, `1 = ve300`, `2 = ve310`, `3 = ve400`</td></tr>
<tr><td>`Ambiente`</td><td>Define o ambiente de processamento da SEFAZ.</td><td>`0 = taProducao` (Produção), `1 = taHomologacao` (Homologação)</td></tr>
<tr><td>`FormaEmissao`</td><td>Define a forma de emissão do documento.</td><td>`0 = teNormal`, `1 = teContingencia`, `2 = teSCAN`, `3 = teDPEC`, `4 = teFSDA`, `5 = teSVCAN`, `6 = teSVCRS`, `7 = teSVCSP`, `8 = teOffLine`</td></tr>
<tr><td>`IdCSC`</td><td>Identificador do Código de Segurança do Contribuinte (CSC), obrigatório para NFCe.</td><td>String alfanumérica</td></tr>
<tr><td>`CSC`</td><td>Código de Segurança do Contribuinte (CSC), obrigatório para NFCe.</td><td>String alfanumérica</td></tr>
<tr><td>`PathSchemas`</td><td>Caminho para os arquivos XSD utilizados na validação dos XMLs.</td><td>Caminho do diretório</td></tr>
<tr><td>`SalvarGer`</td><td>Define se os XMLs de envio e retorno serão salvos em disco.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`ExibirErroSchema`</td><td>Define se erros de validação de schema serão exibidos.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`RetirarAcentos`</td><td>Define se acentos e cedilhas serão removidos do XML.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`RetirarEspacos`</td><td>Define se espaços em branco extras serão removidos do XML.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`IdentarXML`</td><td>Define se o XML será indentado para melhor legibilidade.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`ValidarDigest`</td><td>Define se o DigestValue do certificado será comparado.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`VersaoQRCode`</td><td>Define a versão do QRCode da NFCe.</td><td>`0 = veqr000`, `1 = veqr100`, `2 = veqr200`, `3 = veqr300`</td></tr>
<tr><td>`SalvarWS`</td><td>Define se os XMLs de envio e retorno com envelopes serão salvos.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`Timeout`</td><td>Tempo limite em milissegundos para resposta do webservice.</td><td>Valor numérico (padrão: 5000)</td></tr>
<tr><td>`PathSalvar`</td><td>Caminho onde os XMLs em geral serão salvos.</td><td>Caminho do diretório</td></tr>
<tr><td>`SalvarEvento`</td><td>Define se os eventos de NFe (cancelamento, CC-e, etc.) serão salvos.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`PathNFe`</td><td>Caminho onde os XMLs da NFe serão salvos.</td><td>Caminho do diretório</td></tr>
<tr><td>`PathEvento`</td><td>Caminho onde os XMLs de envio e retorno de eventos serão salvos.</td><td>Caminho do diretório</td></tr>
</table>

### 2.2. Seção `[DFe]` (Configurações de Certificado Digital)

Esta seção é fundamental para a configuração do certificado digital, que é utilizado para assinar os documentos fiscais eletrônicos e garantir a segurança da comunicação com a SEFAZ. As chaves importantes incluem:

<table header-row="true">
<tr><td>**CHAVE**</td><td>**DESCRIÇÃO**</td><td>**VALORES POSSÍVEIS**</td></tr>
<tr><td>`ArquivoPFX`</td><td>Caminho completo e nome do arquivo PFX do certificado digital.</td><td>Caminho do arquivo</td></tr>
<tr><td>`DadosPFX`</td><td>Dados PFX do certificado digital (alternativa a `ArquivoPFX`).</td><td>String de dados PFX</td></tr>
<tr><td>`NumeroSerie`</td><td>Número de série do certificado digital.</td><td>String alfanumérica</td></tr>
<tr><td>`Senha`</td><td>Senha de acesso ao certificado digital.</td><td>String</td></tr>
<tr><td>`VerificarValidade`</td><td>Verifica a validade do certificado digital antes do uso.</td><td>`0 = Não`, `1 = Sim`</td></tr>
<tr><td>`SSLCryptLib`</td><td>Define o "engine" da biblioteca de criptografia.</td><td>`0 = cryNone`, `1 = cryOpenSSL`, `3 = cryWinCrypt`</td></tr>
<tr><td>`SSLHttpLib`</td><td>Define a API de comunicação segura (HTTP).</td><td>`0 = httpNone`, `1 = httpWinINet`, `2 = httpWinHttp`, `3 = httpOpenSSL`</td></tr>
<tr><td>`SSLXmlSignLib`</td><td>Define a API de manipulação do XML para assinatura digital.</td><td>`0 = xsNone`, `4 = xsLibXml2`</td></tr>
<tr><td>`UF`</td><td>Sigla da Unidade Federativa (UF) do emitente.</td><td>Sigla da UF (ex: SP, RJ)</td></tr>
<tr><td>`TimeZone.Modo`</td><td>Define a configuração de fuso horário.</td><td>`0 = tzSistema`, `1 = tzPCN`, `2 = tzManual`</td></tr>
</table>

### 2.3. Seção `[Principal]` (Configurações Gerais da Biblioteca)

Esta seção contém configurações que afetam o comportamento geral da ACBrLib, independentemente do módulo específico:

<table header-row="true">
<tr><td>**CHAVE**</td><td>**DESCRIÇÃO**</td><td>**VALORES POSSÍVEIS**</td></tr>
<tr><td>`TipoResposta`</td><td>Define o formato da resposta dos métodos da biblioteca.</td><td>`0 = Formato INI` (Padrão), `1 = Formato XML`, `2 = Formato JSON`</td></tr>
<tr><td>`CodificacaoResposta`</td><td>Define a codificação dos caracteres nas respostas.</td><td>`0 = UTF8` (Padrão), `1 = ANSI`</td></tr>
<tr><td>`LogNivel`</td><td>Define o nível de detalhe do log da biblioteca.</td><td>`0 = Nenhum`, `1 = Simples`, `2 = Normal`, `3 = Completo`, `4 = Paranoico`</td></tr>
<tr><td>`LogPath`</td><td>Caminho onde o arquivo de log da biblioteca será salvo.</td><td>Caminho do diretório</td></tr>
</table>

### 2.4. Seção `[Integrador]` (Configurações para o Estado do Ceará)

Esta seção é específica para as configurações do integrador utilizado pelas Libs que emitem Documentos Fiscais Eletrônicos para o estado do Ceará. As chaves incluem:

<table header-row="true">
<tr><td>**CHAVE**</td><td>**DESCRIÇÃO**</td><td>**VALORES POSSÍVEIS**</td></tr>
<tr><td>`ArqLog`</td><td>Define o arquivo de log para o integrador.</td><td>Caminho do arquivo</td></tr>
<tr><td>`PastaInput`</td><td>Define onde será salvo o arquivo que será enviado ao integrador.</td><td>Caminho do diretório</td></tr>
<tr><td>`PastaOutput`</td><td>Define a pasta onde estará o arquivo de resposta do integrador.</td><td>Caminho do diretório</td></tr>
<tr><td>`Timeout`</td><td>Define o tempo de espera pela resposta do integrador.</td><td>Valor numérico</td></tr>
</table>

## 3. Fluxo de Emissão de NFe ou NFCe

O processo de emissão de uma NFe ou NFCe pode ser realizado através de uma sequência de chamadas de métodos da ACBrLib. É importante notar que os dados para NFCe são semelhantes aos da NFe, com algumas diferenças em grupos e campos não obrigatórios para NFCe. As configurações de certificado, SSL e ambiente de WebService devem ser previamente configuradas.

O fluxo básico para emissão é o seguinte:

1.  **Carregar Dados**: Utilize `NFE_CarregarINI(eArquivoOuIni)` ou `NFE_CarregarXML(eArquivoOuXml)` para carregar os dados da NFe/NFCe a ser emitida. Para detalhes sobre o preenchimento do arquivo INI, consulte os modelos fornecidos pela ACBrLib [3] [4].
2.  **Assinar**: Chame `NFE_Assinar()` para assinar digitalmente todos os XMLs carregados.
3.  **Validar**: Execute `NFE_Validar()` para validar as notas carregadas contra o schema XML da SEFAZ.
4.  **Salvar XML (Opcional)**: Utilize `NFE_ObterXml()` ou `NFE_GravarXml()` para salvar o XML antes do envio. Isso é recomendado para fins de depuração e consulta em caso de falhas de comunicação.
5.  **Enviar**: Chame `NFE_Enviar(lImprimir, bSincrono)` para enviar as notas para a SEFAZ. Para NFCe, é aconselhável definir `bSincrono = True` para um envio síncrono. O parâmetro `lImprimir` pode ser definido como `True` para imprimir o DANFE/DANFCE automaticamente após o sucesso do envio.
6.  **Imprimir (Opcional)**: Caso não tenha impresso no passo anterior, utilize `NFE_Imprimir()` ou `NFE_ImprimirPDF()` para gerar e/ou imprimir o DANFE/DANFCE.
7.  **Enviar por E-mail (Opcional)**: Use `NFE_EnviarEmail()` para enviar a NFe/NFCe por e-mail.

## 4. Métodos Principais da ACBrLibNFe

A ACBrLibNFe oferece uma vasta gama de métodos para gerenciar o ciclo de vida das Notas Fiscais Eletrônicas. Abaixo, uma tabela com os métodos mais frequentemente utilizados:

<table header-row="true">
<tr><td>**MÉTODO**</td><td>**DESCRIÇÃO**</td></tr>
<tr><td>`NFE_CarregarINI`</td><td>Carrega os dados de uma NFe/NFCe a partir de um arquivo INI ou string.</td></tr>
<tr><td>`NFE_CarregarXML`</td><td>Carrega os dados de uma NFe/NFCe a partir de um arquivo XML ou string.</td></tr>
<tr><td>`NFE_LimparLista`</td><td>Limpa a lista de notas carregadas na biblioteca.</td></tr>
<tr><td>`NFE_Assinar`</td><td>Assina digitalmente os XMLs das notas carregadas.</td></tr>
<tr><td>`NFE_Validar`</td><td>Valida os XMLs das notas carregadas contra os schemas da SEFAZ.</td></tr>
<tr><td>`NFE_ValidarRegrasdeNegocios`</td><td>Valida as regras de negócio da NFe/NFCe.</td></tr>
<tr><td>`NFE_VerificarAssinatura`</td><td>Verifica a assinatura digital de um XML.</td></tr>
<tr><td>`NFE_StatusServico`</td><td>Consulta o status do serviço da SEFAZ.</td></tr>
<tr><td>`NFE_Consultar`</td><td>Consulta a situação de uma NFe/NFCe na SEFAZ.</td></tr>
<tr><td>`NFE_Inutilizar`</td><td>Solicita a inutilização de uma faixa de numeração de NFe/NFCe.</td></tr>
<tr><td>`NFE_Enviar`</td><td>Envia as notas carregadas para a SEFAZ.</td></tr>
<tr><td>`NFE_Cancelar`</td><td>Solicita o cancelamento de uma NFe/NFCe autorizada.</td></tr>
<tr><td>`NFE_EnviarEvento`</td><td>Envia eventos relacionados à NFe/NFCe (Carta de Correção, Manifestação do Destinatário, etc.).</td></tr>
<tr><td>`NFE_DistribuicaoDFe`</td><td>Realiza a consulta de documentos fiscais eletrônicos distribuídos para um CNPJ.</td></tr>
<tr><td>`NFE_EnviarEmail`</td><td>Envia o XML e/ou DANFE/DANFCE por e-mail.</td></tr>
<tr><td>`NFE_Imprimir`</td><td>Imprime o DANFE/DANFCE.</td></tr>
<tr><td>`NFE_ImprimirPDF`</td><td>Gera o DANFE/DANFCE em formato PDF.</td></tr>
</table>

## 5. Modelos de Arquivo INI para NFe e NFCe

Os arquivos INI são utilizados para fornecer os dados da nota fiscal à ACBrLib. A estrutura é baseada em seções e chaves, onde cada chave representa um campo da nota. Abaixo, um resumo da estrutura básica e exemplos de campos:

### 5.1. Estrutura Básica de um Arquivo INI

Um arquivo INI para NFe/NFCe é composto por diversas seções, cada uma representando um grupo de informações do documento fiscal. As seções mais comuns incluem:

-   `[infNFe]`: Informações gerais da nota, como versão do layout.
-   `[Identificacao]`: Dados de identificação da nota (código, natureza da operação, modelo, série, número, data de emissão, etc.).
-   `[Emitente]`: Informações do emitente (CNPJ/CPF, razão social, endereço, inscrição estadual, etc.).
-   `[Destinatario]`: Informações do destinatário (CNPJ/CPF, razão social, endereço, etc.).
-   `[Produto001]`, `[Produto002]`, etc.: Seções para cada item da nota, contendo dados como código do produto, descrição, NCM, CFOP, quantidade, valor unitário e total.
-   `[ICMS001]`, `[PIS001]`, `[COFINS001]`, etc.: Seções para os impostos de cada item, com detalhes sobre CST/CSOSN, alíquotas, base de cálculo e valores.
-   `[Total]`: Totais da nota (valor total dos produtos, frete, seguro, desconto, IPI, PIS, COFINS, valor total da nota, etc.).
-   `[Transportador]`: Dados da transportadora e do frete.
-   `[Volume001]`: Informações sobre os volumes transportados.
-   `[Fatura]`: Dados da fatura (número, valor original, desconto, valor líquido).
-   `[Duplicata001]`: Dados das duplicatas (número, data de vencimento, valor).
-   `[pag001]`: Informações sobre a forma de pagamento (tipo, valor, bandeira do cartão, etc.).
-   `[DadosAdicionais]`: Informações adicionais de interesse do fisco ou do contribuinte.

### 5.2. Exemplo de Modelo NFe.INI

```ini
[infNFe]
versao=4.00

[Identificacao]
cNF=12345678
natOp=Venda de Mercadoria
indPag=0
mod=55
serie=1
nNF=100000001
dhEmi=2024-01-01T10:00:00-03:00
tpNF=1
idDest=1
tpAmb=1
tpImp=1
tpEmis=1
finNFe=1
indFinal=0
indPres=1
procEmi=0
verProc=ACBrNFe

[Emitente]
CRT=1
CNPJCPF=99999999000199
xNome=EMPRESA TESTE LTDA
xFant=EMPRESA TESTE
IE=123456789
xLgr=Rua Teste
nro=123
xBairro=Centro
cMun=3550308
xMun=Sao Paulo
UF=SP
CEP=01000000
cPais=1058
xPais=BRASIL
Fone=11999999999

[Destinatario]
CNPJCPF=11111111000111
xNome=CLIENTE TESTE
indIEDest=1
IE=ISENTO
xLgr=Av. Cliente
nro=456
xBairro=Jardim
cMun=3550308
xMun=Sao Paulo
UF=SP
CEP=02000000
cPais=1058
xPais=BRASIL
Fone=11888888888

[Produto001]
cProd=001
cEAN=SEM GTIN
xProd=PRODUTO TESTE
NCM=84719012
CFOP=5102
uCom=UN
qCom=1.0000
vUnCom=100.00
vProd=100.00
uTrib=UN
qTrib=1.0000
vUnTrib=100.00
indTot=1

[ICMS001]
orig=0
CSOSN=102

[PIS001]
CST=01
vBC=100.00
pPIS=0.65
vPIS=0.65

[COFINS001]
CST=01
vBC=100.00
pCOFINS=3.00
vCOFINS=3.00

[Total]
vBC=0.00
vICMS=0.00
vBCST=0.00
vST=0.00
vProd=100.00
vFrete=0.00
vSeg=0.00
vDesc=0.00
vII=0.00
vIPI=0.00
vPIS=0.65
vCOFINS=3.00
vOutro=0.00
vNF=100.00

[pag001]
tPag=01
vPag=100.00
```

### 5.3. Exemplo de Modelo NFCe.INI

```ini
[infNFe]
versao=4.00

[Identificacao]
nNF=11
cNF=10000011
serie=3
natOp=Venda de Mercadoria
indPag=0
mod=65
dEmi=2024-01-01T10:00:00-03:00
tpNF=1
finNFe=1
idDest=1
indFinal=1
indPres=1
tpImp=4
tpAmb=1
cUF=35

[Emitente]
CNPJCPF=99999999000199
xNome=RAZAO SOCIAL DE TESTE
xFant=FANTASIA DE TESTE
IE=123456789
IM=1234567
CNAE=6201500
CRT=1
xLgr=Logradouro
nro=1
xCpl=Complemento
xBairro=Bairro
cMun=3550308
xMun=Sao Paulo
UF=SP
CEP=01000000
cPais=1058
xPais=BRASIL
Fone=11999999999

[Destinatario]
CNPJCPF=11111111000111
xNome=CLIENTE TESTE
indIEDest=9

[Produto001]
CFOP=5102
cProd=001
cEAN=SEM GTIN
xProd=PRODUTO TESTE
NCM=84719012
uCom=UN
qCom=1.0000
vUnCom=10.00
vProd=10.00
vDesc=0.00
vFrete=0.00
vSeg=0.00
vOutro=0.00
indEscala=N
uTrib=UN
cEANTrib=SEM GTIN

[ICMS001]
CSOSN=102
Origem=0

[PIS001]
CST=49
vBC=0.00
pPIS=0.00
vPIS=0.00

[COFINS001]
CST=49
vBC=0.00
pCOFINS=0.00
vCOFINS=0.00

[Total]
vBC=0.00
vICMS=0.00
vBCST=0.00
vST=0.00
vProd=10.00
vFrete=0.00
vSeg=0.00
vDesc=0.00
vIPI=0.00
vPIS=0.00
vCOFINS=0.00
vOutro=0.00
vNF=10.00

[pag001]
tPag=01
vPag=10.00
```

## 6. Referências e Links Úteis

Para mais informações e recursos, consulte os seguintes links:

-   [1] **Como Instalar / Distribuir**: [https://acbr.sourceforge.io/ACBrLib/ComoInstalarDistribuir.html](https://acbr.sourceforge.io/ACBrLib/ComoInstalarDistribuir.html)
-   [2] **Dependências**: [https://acbr.sourceforge.io/ACBrLib/Dependencias.html](https://acbr.sourceforge.io/ACBrLib/Dependencias.html)
-   [3] **Modelo NFe.INI**: [https://acbr.sourceforge.io/ACBrLib/ModeloNFeINI.html](https://acbr.sourceforge.io/ACBrLib/ModeloNFeINI.html)
-   [4] **Modelo NFCe.INI**: [https://acbr.sourceforge.io/ACBrLib/Modelo1-NFCeINI.html](https://acbr.sourceforge.io/ACBrLib/Modelo1-NFCeINI.html)
-   **Download dos Binários (Demo)**: [https://www.projetoacbr.com.br/forum/topic/63052-acbrlib-demo-download-livre/](https://www.projetoacbr.com.br/forum/topic/63052-acbrlib-demo-download-livre/)
-   **Exemplos de Uso / Demos (Repositório SVN)**: [http://svn.code.sf.net/p/acbr/code/trunk2/Projetos/ACBrLib/Demos/](http://svn.code.sf.net/p/acbr/code/trunk2/Projetos/ACBrLib/Demos/)
-   **Fórum de Suporte Projeto ACBr**: [https://www.projetoacbr.com.br/forum/](https://www.projetoacbr.com.br/forum/)

---

**Autor**: Manus AI
**Data**: 01 de Fevereiro de 2026
