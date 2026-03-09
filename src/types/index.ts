// Tipos do Sistema ERP SaaS

// Usuário do Sistema
export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'gerente' | 'vendedor' | 'financeiro';
  tenantId: string;
  ativo: boolean;
  dataCriacao?: Date;
}

// Tenant (Empresa/Assinante)
export interface Tenant {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  plano: 'basico' | 'profissional' | 'enterprise';
  status: 'ativo' | 'suspenso' | 'expirado';
  dataCriacao: Date;
  dataExpiracao: Date;
  configuracoes: TenantConfig;
  // Dados adicionais para NF-e
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario?: 'simples' | 'lucro_presumido' | 'lucro_real';
  cnae?: string;
}

export interface TenantConfig {
  corTema: string;
  logoUrl: string;
  moeda: string;
  timezone: string;
  nfSerie: number;
  nfNumeroAtual: number;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Usuário
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'gerente' | 'vendedor' | 'financeiro';
  tenantId: string;
  ativo: boolean;
  avatarUrl?: string;
}

// Tipo para Produto ou Serviço
export type TipoItem = 'produto' | 'servico';

// Unidade de Medida
export interface UnidadeMedida {
  id: string;
  tenantId: string;
  sigla: string; // Ex: UN, CX, PC, KG, LT
  nome: string; // Ex: Unidade, Caixa, Peça, Quilograma, Litro
  fatorConversao?: number; // Fator para conversão (ex: 1 CX = 12 UN)
  unidadeBase?: string; // Sigla da unidade base para conversão
  ativo: boolean;
}

// Produto/Serviço (unificado)
export interface Produto {
  id: string;
  tenantId: string;
  codigo: string;
  codigoBarras?: string; // EAN/GTIN
  nome: string;
  descricao: string;
  tipo: TipoItem; // produto ou servico
  categoriaId: string;
  categoria?: Categoria;
  // Campos fiscais para NF-e
  ncm: string; // Nomenclatura Comum do Mercosul (8 dígitos)
  cst: string; // Código de Situação Tributária
  csosn?: string; // Código de Situação da Operação no Simples Nacional
  cfop: string; // Código Fiscal de Operações e Prestações
  icms?: number; // Alíquota ICMS
  pis?: number; // Alíquota PIS
  cofins?: number; // Alíquota COFINS
  ipi?: number; // Alíquota IPI
  origem?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'; // Origem do produto
  // Unidade de Medida e Conversão
  unidade: string; // Sigla da unidade (UN, CX, etc)
  unidadeId?: string; // ID da unidade de medida cadastrada
  unidadeCompra?: string; // Unidade usada na compra (ex: CX)
  unidadeVenda?: string; // Unidade usada na venda (ex: UN)
  fatorConversaoCompra?: number; // Ex: 1 CX = 12 UN (fator = 12)
  fatorConversaoVenda?: number; // Ex: 1 UN = 1/12 CX
  // Preços
  precoCusto: number;
  precoCustoUnitario?: number; // Preço de custo por unidade base
  precoVenda: number;
  margemLucro?: number;
  // Estoque (apenas para produtos)
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo?: number;
  localizacao?: string; // Local no estoque
  // Fornecedor principal
  fornecedorId?: string;
  fornecedor?: Fornecedor;
  codigoFornecedor?: string; // Código do produto no fornecedor
  // PDV
  atalhoPDV: boolean; // Se aparece como atalho no PDV
  destacarPDV?: boolean; // Destacar no PDV
  corPDV?: string; // Cor do botão no PDV
  ativo: boolean;
  imagemUrl?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

// Categoria
export interface Categoria {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string;
  cor: string;
  ativa: boolean;
}

// Cliente
export interface Cliente {
  id: string;
  tenantId: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  observacoes: string;
  ativo: boolean;
  // Campos para NF-e
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  tipoPessoa?: 'fisica' | 'juridica';
}

// Fornecedor
export interface Fornecedor {
  id: string;
  tenantId: string;
  nome: string;
  razaoSocial?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  email: string;
  telefone: string;
  telefone2?: string;
  endereco: Endereco;
  contato: string; // Nome do contato principal
  cargo?: string; // Cargo do contato
  // Dados bancários
  dadosBancarios?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: 'corrente' | 'poupanca';
    pix?: string;
    tipoPix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  };
  // Dados adicionais
  site?: string;
  observacoes?: string;
  // Categorias de produtos que fornece
  categorias?: string[];
  // Status
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao?: Date;
}

// Vendedor (gerenciado no banco, não no Firebase Auth)
export interface Vendedor {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  senha: string; // Hash da senha
  comissao: number; // Percentual de comissão (ex: 5.5 para 5.5%)
  metaVendas: number; // Meta mensal de vendas
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
  ultimoAcesso?: Date;
}

// Conta a Pagar
export interface ContaPagar {
  id: string;
  tenantId: string;
  descricao: string;
  valor: number;
  vencimento: Date;
  dataPagamento?: Date;
  dataBaixa?: Date; // Data em que foi registrado o pagamento
  status: 'pendente' | 'pago' | 'vencido';
  categoria: string;
  fornecedor?: Fornecedor;
  fornecedorId?: string;
  observacoes: string;
  recorrente: boolean;
  // Integração bancária
  bancoId?: string;
  formaPagamento?: 'dinheiro' | 'pix' | 'boleto' | 'transferencia' | 'cartao';
  documentoRef?: string; // Número do documento
}

// Conta a Receber
export interface ContaReceber {
  id: string;
  tenantId: string;
  descricao: string;
  valor: number;
  vencimento: Date;
  dataRecebimento?: Date;
  dataBaixa?: Date; // Data em que foi registrado o recebimento
  status: 'pendente' | 'recebido' | 'vencido';
  categoria: string;
  cliente?: Cliente;
  clienteId?: string;
  observacoes: string;
  // Integração bancária
  bancoId?: string;
  formaRecebimento?: 'dinheiro' | 'pix' | 'boleto' | 'transferencia' | 'cartao';
  documentoRef?: string;
}

// Configuração de Banco para Integração
export interface ConfigBanco {
  id: string;
  tenantId: string;
  nome: string; // Ex: "Itaú", "Bradesco", "Banco do Brasil"
  codigo: string; // Código do banco (Ex: 341, 237, 001)
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca';
  cnpjCedente?: string;
  // Configurações de remessa/retorno
  convenio?: string;
  carteira?: string;
  variacao?: string;
  // PIX
  chavePix?: string;
  tipoChavePix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  ativo: boolean;
}

// Configuração de Impressora Fiscal
export interface ConfigImpressora {
  id: string;
  tenantId: string;
  nome: string;
  modelo: string;
  marca: string;
  porta: string; // USB, COM1, Network, etc
  ip?: string;
  // Configurações de impressão
  colunas: number; // 48 ou 80
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  // SAT/NFC-e
  codigoAtivacao?: string;
  serie?: string;
  ativo: boolean;
  principal: boolean;
}

// Parâmetros do Sistema (Admin Master - globais)
export interface ParametrosGlobais {
  id: string;
  versaoLayoutNFe: string; // Ex: "4.00"
  versaoLayoutNFCe: string;
  versaoLayoutNFSe: string;
  urlServicoNFe: string;
  urlServicoNFCe: string;
  urlServicoNFSe: string;
  // Tabelas de CFOP, CST, CSOSN
  atualizadoEm: Date;
}

// Parâmetros por Tenant (específicos do cliente)
export interface ParametrosTenant {
  id: string;
  tenantId: string;
  // Certificado Digital
  certificadoDigital?: {
    arquivoUrl?: string;
    senha?: string;
    vencimento?: Date;
  };
  // NF-e
  serieNFe: number;
  serieNFCe: number;
  proximoNumeroNFe: number;
  proximoNumeroNFCe: number;
  ambiente: 'producao' | 'homologacao';
  // E-mails para notificação
  emailNFe?: string;
  // Contabilidade
  emailContador?: string;
  // Impostos padrão
  icmsPadrao: number;
  pisPadrao: number;
  cofinsPadrao: number;
}

// Nota Fiscal
export interface NotaFiscal {
  id: string;
  tenantId: string;
  numero: string;
  serie: string;
  chave: string;
  tipo: 'entrada' | 'saida';
  modelo: 'NF-e' | 'NFC-e';
  emitente: EmitenteDestinatario;
  destinatario: EmitenteDestinatario;
  valorTotal: number;
  valorProdutos: number;
  valorServicos?: number;
  // Impostos
  valorICMS: number;
  valorPIS: number;
  valorCOFINS: number;
  valorIPI?: number;
  valorISS?: number;
  // Totais
  baseCalculoICMS?: number;
  valorICMSST?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  valorOutras?: number;
  dataEmissao: Date;
  dataEntradaSaida?: Date;
  xmlUrl: string;
  xmlConteudo?: string; // XML completo
  pdfUrl?: string;
  status: 'autorizada' | 'cancelada' | 'rejeitada' | 'pendente' | 'denegada';
  produtos: ProdutoNotaFiscal[];
  // Protocolo
  protocolo?: string;
  dataProtocolo?: Date;
  motivo?: string;
  // Venda relacionada
  vendaId?: string;
  pedidoId?: string;
  ordemServicoId?: string;
}

export interface EmitenteDestinatario {
  nome: string;
  cnpj: string;
  ie?: string;
  im?: string;
  endereco: Endereco;
  email?: string;
  telefone?: string;
}

export interface ProdutoNotaFiscal {
  codigo: string;
  codigoBarras?: string;
  nome: string;
  ncm: string;
  cfop: string;
  cst: string;
  csosn?: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  // Impostos
  valorICMS?: number;
  valorPIS?: number;
  valorCOFINS?: number;
  valorIPI?: number;
  baseCalculoICMS?: number;
}

// Venda
export interface Venda {
  id: string;
  tenantId: string;
  numero: number;
  cliente?: Cliente;
  clienteId?: string;
  vendedorId?: string;
  vendedor?: Vendedor;
  itens: ItemVenda[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
  status: 'concluida' | 'cancelada' | 'pendente';
  dataVenda: Date;
  observacoes: string;
  notaFiscalId?: string;
  valorComissao?: number;
  // Origem
  pedidoId?: string;
  ordemServicoId?: string;
}

export interface ItemVenda {
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

// Ordem de Serviço
export interface OrdemServico {
  id: string;
  tenantId: string;
  numero: number;
  cliente: Cliente;
  clienteId: string;
  descricao: string;
  servicos: ServicoOS[];
  produtos?: ItemVenda[];
  valorServicos: number;
  valorProdutos: number;
  valorTotal: number;
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada' | 'aprovada' | 'convertida';
  ativo: boolean; // Para filtrar inativos
  dataAbertura: Date;
  dataPrevisao?: Date;
  dataConclusao?: Date;
  dataAprovacao?: Date;
  tecnico?: string;
  observacoes: string;
  // Conversão para venda
  vendaId?: string;
  dataConversao?: Date;
  // Parcelas
  parcelas?: ParcelaOS[];
}

export interface ServicoOS {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
}

export interface ParcelaOS {
  numero: number;
  valor: number;
  vencimento: Date;
  status: 'pendente' | 'pago';
}

// Entrega
export interface Entrega {
  id: string;
  tenantId: string;
  vendaId: string;
  venda?: Venda;
  cliente: Cliente;
  enderecoEntrega: Endereco;
  status: 'pendente' | 'em_rota' | 'entregue' | 'cancelada';
  dataPrevista: Date;
  dataEntrega?: Date;
  motorista?: string;
  veiculo?: string;
  observacoes: string;
}

// Movimentação de Estoque
export interface MovimentacaoEstoque {
  id: string;
  tenantId: string;
  produtoId: string;
  produto?: Produto;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  documentoRef?: string;
  data: Date;
  usuarioId: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  receitaMes: number;
  despesaMes: number;
  lucroMes: number;
  vendasMes: number;
  contasPagarVencidas: number;
  contasReceberVencidas: number;
  estoqueCritico: number;
  ordensServicoAbertas: number;
  variacaoReceita: number;
  variacaoDespesa: number;
}

// Plano de Assinatura
export interface PlanoAssinatura {
  id: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  precoAnual: number;
  recursos: RecursoPlano[];
  limiteProdutos: number;
  limiteUsuarios: number;
  limiteVendas: number;
  suporte: 'email' | 'chat' | 'telefone' | 'prioritario';
}

export interface RecursoPlano {
  nome: string;
  incluido: boolean;
  limite?: number;
}

// Movimentação Financeira para Fluxo de Caixa
export interface MovimentacaoFinanceira {
  id: string;
  tenantId: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria: string;
  data: Date;
  contaId: string;
  documentoRef?: string;
}

// Pedido (Orçamento/Pré-venda)
export interface Pedido {
  id: string;
  tenantId: string;
  numero: number;
  cliente?: Cliente;
  clienteId?: string;
  nomeCliente?: string;
  vendedorId?: string;
  vendedor?: Vendedor;
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  total: number;
  status: 'pendente' | 'aprovado' | 'convertido' | 'cancelado';
  prazoEntrega?: Date;
  condicaoPagamento: string;
  observacoes: string;
  dataCriacao: Date;
  dataAprovacao?: Date;
  vendaId?: string;
  criadoPor: string;
}

export interface ItemPedido {
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

// Módulos do sistema
export type Module = 'dashboard' | 'produtos' | 'estoque' | 'financeiro' | 'faturamento' | 'pdv' | 'pedidos' | 'operacional' | 'parametros' | 'admin' | 'funcionarios' | 'categorias' | 'fornecedores' | 'clientes' | 'unidades' | 'relatorios';

// Permissões de acesso aos módulos
export interface PermissoesAcesso {
  dashboard: boolean;
  produtos: boolean;
  estoque: boolean;
  financeiro: boolean;
  faturamento: boolean;
  pdv: boolean;
  pedidos: boolean;
  operacional: boolean;
  parametros: boolean;
  admin: boolean;
  funcionarios: boolean;
  categorias: boolean;
  fornecedores: boolean;
  clientes: boolean;
  unidades: boolean;
  relatorios: boolean;
}

// Funcionário (gerenciado no banco de dados, não no Firebase Auth)
export interface Funcionario {
  id: string;
  tenantId: string;
  nome: string;
  cpf: string;
  rg?: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  cargo: string;
  departamento: string;
  salario?: number;
  dataAdmissao?: Date;
  dataNascimento?: Date;
  // Permissões de acesso ao sistema
  permissoes: PermissoesAcesso;
  // Credenciais de acesso (senha hasheada)
  senha: string;
  // Status
  ativo: boolean;
  podeAcessarSistema: boolean;
  // Metadados
  dataCriacao: Date;
  dataAtualizacao: Date;
  ultimoAcesso?: Date;
  criadoPor: string; // ID do admin que criou
}
