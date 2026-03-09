import { Tenant, Produto, Categoria, ContaPagar, ContaReceber, NotaFiscal, Venda, OrdemServico, Cliente, DashboardMetrics, PlanoAssinatura, Pedido } from '@/types';

export const mockTenant: Tenant = {
  id: 'tenant-001',
  nome: 'Empresa Demo Ltda',
  cnpj: '12.345.678/0001-90',
  email: 'contato@empresademo.com.br',
  telefone: '(11) 99999-9999',
  endereco: {
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Sala 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100'
  },
  plano: 'profissional',
  status: 'ativo',
  dataCriacao: new Date('2024-01-01'),
  dataExpiracao: new Date('2025-12-31'),
  configuracoes: {
    corTema: '#2563eb',
    logoUrl: '',
    moeda: 'BRL',
    timezone: 'America/Sao_Paulo',
    nfSerie: 1,
    nfNumeroAtual: 1000
  }
};

export const mockCategorias: Categoria[] = [
  { id: 'cat-001', tenantId: 'tenant-001', nome: 'Eletrônicos', descricao: 'Produtos eletrônicos', cor: '#3b82f6', ativa: true },
  { id: 'cat-002', tenantId: 'tenant-001', nome: 'Acessórios', descricao: 'Acessórios diversos', cor: '#10b981', ativa: true },
  { id: 'cat-003', tenantId: 'tenant-001', nome: 'Informática', descricao: 'Produtos de informática', cor: '#f59e0b', ativa: true },
  { id: 'cat-004', tenantId: 'tenant-001', nome: 'Escritório', descricao: 'Materiais de escritório', cor: '#8b5cf6', ativa: true },
];

export const mockProdutos: Produto[] = [
  { id: 'prod-001', tenantId: 'tenant-001', codigo: '001', codigoBarras: '7891234567890', nome: 'Smartphone Samsung Galaxy', descricao: 'Smartphone 128GB', tipo: 'produto', categoriaId: 'cat-001', ncm: '8517.12.31', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 1200, precoVenda: 1800, estoqueAtual: 25, estoqueMinimo: 10, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-002', tenantId: 'tenant-001', codigo: '002', codigoBarras: '7891234567891', nome: 'Notebook Dell Inspiron', descricao: 'Notebook i5 8GB RAM', tipo: 'produto', categoriaId: 'cat-003', ncm: '8471.30.19', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 2500, precoVenda: 3500, estoqueAtual: 8, estoqueMinimo: 5, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-003', tenantId: 'tenant-001', codigo: '003', codigoBarras: '7891234567892', nome: 'Mouse Wireless Logitech', descricao: 'Mouse sem fio', tipo: 'produto', categoriaId: 'cat-002', ncm: '8473.30.11', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 50, precoVenda: 89, estoqueAtual: 3, estoqueMinimo: 15, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-004', tenantId: 'tenant-001', codigo: '004', codigoBarras: '7891234567893', nome: 'Teclado Mecânico RGB', descricao: 'Teclado gamer mecânico', tipo: 'produto', categoriaId: 'cat-002', ncm: '8473.30.11', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 150, precoVenda: 280, estoqueAtual: 12, estoqueMinimo: 5, atalhoPDV: false, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-005', tenantId: 'tenant-001', codigo: '005', codigoBarras: '7891234567894', nome: 'Monitor 27" LG', descricao: 'Monitor Full HD', tipo: 'produto', categoriaId: 'cat-003', ncm: '8528.52.20', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 800, precoVenda: 1200, estoqueAtual: 5, estoqueMinimo: 3, atalhoPDV: false, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-006', tenantId: 'tenant-001', codigo: '006', codigoBarras: '7891234567895', nome: 'Headset Gamer HyperX', descricao: 'Headset 7.1', tipo: 'produto', categoriaId: 'cat-002', ncm: '8518.30.00', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 200, precoVenda: 350, estoqueAtual: 20, estoqueMinimo: 10, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-007', tenantId: 'tenant-001', codigo: '007', codigoBarras: '7891234567896', nome: 'Papel A4 Chamex 500folhas', descricao: 'Resma de papel A4', tipo: 'produto', categoriaId: 'cat-004', ncm: '4802.56.99', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 18, precoVenda: 28, estoqueAtual: 50, estoqueMinimo: 20, atalhoPDV: false, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-008', tenantId: 'tenant-001', codigo: '008', codigoBarras: '7891234567897', nome: 'Impressora HP Laser', descricao: 'Impressora laser monocromática', tipo: 'produto', categoriaId: 'cat-003', ncm: '8443.32.41', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, unidade: 'UN', precoCusto: 600, precoVenda: 950, estoqueAtual: 2, estoqueMinimo: 3, atalhoPDV: false, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-009', tenantId: 'tenant-001', codigo: 'SVC-001', nome: 'Instalação de Software', descricao: 'Serviço de instalação e configuração', tipo: 'servico', categoriaId: 'cat-002', ncm: '00', cst: '000', csosn: '102', cfop: '5933', icms: 0, pis: 0.65, cofins: 3, unidade: 'HR', precoCusto: 0, precoVenda: 150, estoqueAtual: 0, estoqueMinimo: 0, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 'prod-010', tenantId: 'tenant-001', codigo: 'SVC-002', nome: 'Suporte Técnico Remoto', descricao: 'Atendimento técnico remoto por hora', tipo: 'servico', categoriaId: 'cat-002', ncm: '00', cst: '000', csosn: '102', cfop: '5933', icms: 0, pis: 0.65, cofins: 3, unidade: 'HR', precoCusto: 0, precoVenda: 80, estoqueAtual: 0, estoqueMinimo: 0, atalhoPDV: true, ativo: true, dataCriacao: new Date(), dataAtualizacao: new Date() },
];

export const mockClientes: Cliente[] = [
  { id: 'cli-001', tenantId: 'tenant-001', nome: 'João Silva', cpfCnpj: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 98765-4321', endereco: { logradouro: 'Rua A', numero: '100', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' }, observacoes: '', ativo: true },
  { id: 'cli-002', tenantId: 'tenant-001', nome: 'Maria Santos', cpfCnpj: '987.654.321-00', email: 'maria@email.com', telefone: '(11) 91234-5678', endereco: { logradouro: 'Av. B', numero: '200', complemento: 'Apto 10', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '02000-000' }, observacoes: '', ativo: true },
  { id: 'cli-003', tenantId: 'tenant-001', nome: 'Empresa ABC Ltda', cpfCnpj: '11.222.333/0001-44', email: 'contato@abc.com', telefone: '(11) 3456-7890', endereco: { logradouro: 'Rua C', numero: '300', complemento: '', bairro: 'Industrial', cidade: 'Campinas', estado: 'SP', cep: '13000-000' }, observacoes: 'Cliente VIP', ativo: true },
];

export const mockContasPagar: ContaPagar[] = [
  { id: 'cp-001', tenantId: 'tenant-001', descricao: 'Fornecedor de Eletrônicos', valor: 15000, vencimento: new Date('2024-12-15'), status: 'pendente', categoria: 'Fornecedores', observacoes: 'Nota fiscal 12345', recorrente: false },
  { id: 'cp-002', tenantId: 'tenant-001', descricao: 'Aluguel do Escritório', valor: 3500, vencimento: new Date('2024-12-10'), status: 'pago', dataPagamento: new Date('2024-12-08'), categoria: 'Despesas Fixas', observacoes: '', recorrente: true },
  { id: 'cp-003', tenantId: 'tenant-001', descricao: 'Energia Elétrica', valor: 850, vencimento: new Date('2024-12-05'), status: 'vencido', categoria: 'Utilidades', observacoes: '', recorrente: true },
  { id: 'cp-004', tenantId: 'tenant-001', descricao: 'Internet e Telefone', valor: 450, vencimento: new Date('2024-12-20'), status: 'pendente', categoria: 'Utilidades', observacoes: '', recorrente: true },
  { id: 'cp-005', tenantId: 'tenant-001', descricao: 'Folha de Pagamento', valor: 25000, vencimento: new Date('2024-12-05'), status: 'pago', dataPagamento: new Date('2024-12-05'), categoria: 'Pessoal', observacoes: '', recorrente: true },
];

export const mockContasReceber: ContaReceber[] = [
  { id: 'cr-001', tenantId: 'tenant-001', descricao: 'Venda para Cliente ABC', valor: 8500, vencimento: new Date('2024-12-10'), status: 'recebido', dataRecebimento: new Date('2024-12-08'), categoria: 'Vendas', clienteId: 'cli-003', observacoes: '' },
  { id: 'cr-002', tenantId: 'tenant-001', descricao: 'Serviço de Manutenção', valor: 1200, vencimento: new Date('2024-12-15'), status: 'pendente', categoria: 'Serviços', clienteId: 'cli-001', observacoes: '' },
  { id: 'cr-003', tenantId: 'tenant-001', descricao: 'Venda de Equipamentos', valor: 5600, vencimento: new Date('2024-12-01'), status: 'vencido', categoria: 'Vendas', clienteId: 'cli-002', observacoes: 'Ligar para cobrar' },
  { id: 'cr-004', tenantId: 'tenant-001', descricao: 'Consultoria Técnica', valor: 3000, vencimento: new Date('2024-12-25'), status: 'pendente', categoria: 'Serviços', clienteId: 'cli-003', observacoes: '' },
  { id: 'cr-005', tenantId: 'tenant-001', descricao: 'Venda Online', valor: 2100, vencimento: new Date('2024-12-18'), status: 'pendente', categoria: 'Vendas', observacoes: '' },
];

export const mockVendas: Venda[] = [
  { id: 'venda-001', tenantId: 'tenant-001', numero: 1001, clienteId: 'cli-001', itens: [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 1800, desconto: 0, total: 1800 }], subtotal: 1800, desconto: 0, total: 1800, formaPagamento: 'cartao_credito', status: 'concluida', dataVenda: new Date('2024-12-01'), observacoes: '' },
  { id: 'venda-002', tenantId: 'tenant-001', numero: 1002, clienteId: 'cli-003', itens: [{ produtoId: 'prod-002', quantidade: 2, precoUnitario: 3500, desconto: 200, total: 6800 }, { produtoId: 'prod-005', quantidade: 2, precoUnitario: 1200, desconto: 0, total: 2400 }], subtotal: 9400, desconto: 200, total: 9200, formaPagamento: 'boleto', status: 'concluida', dataVenda: new Date('2024-12-03'), observacoes: 'Desconto especial' },
  { id: 'venda-003', tenantId: 'tenant-001', numero: 1003, itens: [{ produtoId: 'prod-003', quantidade: 3, precoUnitario: 89, desconto: 0, total: 267 }, { produtoId: 'prod-004', quantidade: 1, precoUnitario: 280, desconto: 0, total: 280 }], subtotal: 547, desconto: 47, total: 500, formaPagamento: 'pix', status: 'concluida', dataVenda: new Date('2024-12-05'), observacoes: '' },
];

export const mockOrdensServico: OrdemServico[] = [
  { id: 'os-001', tenantId: 'tenant-001', numero: 101, clienteId: 'cli-001', cliente: mockClientes[0], descricao: 'Manutenção de computador', servicos: [{ descricao: 'Formatação e instalação', quantidade: 1, valorUnitario: 150, total: 150 }], valorServicos: 150, valorProdutos: 0, valorTotal: 150, status: 'concluida', ativo: true, dataAbertura: new Date('2024-12-01'), dataConclusao: new Date('2024-12-02'), tecnico: 'Carlos', observacoes: '' },
  { id: 'os-002', tenantId: 'tenant-001', numero: 102, clienteId: 'cli-002', cliente: mockClientes[1], descricao: 'Instalação de rede', servicos: [{ descricao: 'Cabeamento estruturado', quantidade: 1, valorUnitario: 500, total: 500 }, { descricao: 'Configuração de roteadores', quantidade: 2, valorUnitario: 100, total: 200 }], valorServicos: 700, valorProdutos: 0, valorTotal: 700, status: 'em_andamento', ativo: true, dataAbertura: new Date('2024-12-05'), dataPrevisao: new Date('2024-12-10'), tecnico: 'Pedro', observacoes: 'Aguardando material' },
  { id: 'os-003', tenantId: 'tenant-001', numero: 103, clienteId: 'cli-003', cliente: mockClientes[2], descricao: 'Suporte técnico mensal', servicos: [{ descricao: 'Suporte remoto', quantidade: 10, valorUnitario: 50, total: 500 }], valorServicos: 500, valorProdutos: 0, valorTotal: 500, status: 'aberta', ativo: true, dataAbertura: new Date('2024-12-08'), observacoes: 'Contrato mensal' },
  { id: 'os-004', tenantId: 'tenant-001', numero: 104, clienteId: 'cli-001', cliente: mockClientes[0], descricao: 'Configuração de servidor', servicos: [{ descricao: 'Instalação de servidor', quantidade: 1, valorUnitario: 800, total: 800 }, { descricao: 'Configuração de backup', quantidade: 1, valorUnitario: 200, total: 200 }], valorServicos: 1000, valorProdutos: 0, valorTotal: 1000, status: 'aprovada', ativo: true, dataAbertura: new Date('2024-12-09'), dataAprovacao: new Date('2024-12-10'), tecnico: 'Carlos', observacoes: 'Aguardando conversão para venda' },
];

export const mockNotasFiscais: NotaFiscal[] = [
  { id: 'nf-001', tenantId: 'tenant-001', numero: '1000', serie: '1', chave: '35241212345678000190550010000010001123456789', tipo: 'saida', modelo: 'NF-e', emitente: { nome: 'Empresa Demo Ltda', cnpj: '12.345.678/0001-90', ie: '123.456.789.123', endereco: mockTenant.endereco }, destinatario: { nome: 'Empresa ABC Ltda', cnpj: '11.222.333/0001-44', ie: '111.222.333.444', endereco: { logradouro: 'Rua C', numero: '300', complemento: '', bairro: 'Industrial', cidade: 'Campinas', estado: 'SP', cep: '13000-000' } }, valorTotal: 9200, valorProdutos: 9200, valorICMS: 1656, valorPIS: 60.72, valorCOFINS: 279.36, dataEmissao: new Date('2024-12-03'), xmlUrl: '', status: 'autorizada', produtos: [] },
  { id: 'nf-002', tenantId: 'tenant-001', numero: '1001', serie: '1', chave: '35241212345678000190550010000010011123456780', tipo: 'saida', modelo: 'NFC-e', emitente: { nome: 'Empresa Demo Ltda', cnpj: '12.345.678/0001-90', ie: '123.456.789.123', endereco: mockTenant.endereco }, destinatario: { nome: 'Consumidor Final', cnpj: '', ie: '', endereco: { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' } }, valorTotal: 500, valorProdutos: 500, valorICMS: 90, valorPIS: 3.30, valorCOFINS: 15.18, dataEmissao: new Date('2024-12-05'), xmlUrl: '', status: 'autorizada', produtos: [] },
];

export const mockPedidos: Pedido[] = [
  { 
    id: 'ped-001', 
    tenantId: 'tenant-001', 
    numero: 2001, 
    clienteId: 'cli-001',
    nomeCliente: 'João Silva',
    itens: [
      { produtoId: 'prod-001', quantidade: 2, precoUnitario: 1800, desconto: 100, total: 3500 },
      { produtoId: 'prod-003', quantidade: 1, precoUnitario: 89, desconto: 0, total: 89 }
    ], 
    subtotal: 3689, 
    desconto: 100, 
    total: 3589, 
    status: 'pendente',
    prazoEntrega: new Date('2024-12-20'),
    condicaoPagamento: '30/60 dias',
    observacoes: 'Cliente solicita entrega no período da manhã',
    dataCriacao: new Date('2024-12-08'),
    criadoPor: 'vendedor1'
  },
  { 
    id: 'ped-002', 
    tenantId: 'tenant-001', 
    numero: 2002, 
    clienteId: 'cli-003',
    nomeCliente: 'Empresa ABC Ltda',
    itens: [
      { produtoId: 'prod-002', quantidade: 5, precoUnitario: 3500, desconto: 500, total: 17000 },
      { produtoId: 'prod-005', quantidade: 5, precoUnitario: 1200, desconto: 0, total: 6000 }
    ], 
    subtotal: 23500, 
    desconto: 500, 
    total: 23000, 
    status: 'pendente',
    prazoEntrega: new Date('2024-12-18'),
    condicaoPagamento: 'À vista',
    observacoes: 'Pedido grande - verificar disponibilidade de estoque',
    dataCriacao: new Date('2024-12-07'),
    criadoPor: 'vendedor2'
  },
  { 
    id: 'ped-003', 
    tenantId: 'tenant-001', 
    numero: 2003, 
    clienteId: 'cli-002',
    nomeCliente: 'Maria Santos',
    itens: [
      { produtoId: 'prod-004', quantidade: 1, precoUnitario: 280, desconto: 30, total: 250 },
      { produtoId: 'prod-006', quantidade: 1, precoUnitario: 350, desconto: 0, total: 350 }
    ], 
    subtotal: 630, 
    desconto: 30, 
    total: 600, 
    status: 'aprovado',
    prazoEntrega: new Date('2024-12-15'),
    condicaoPagamento: 'PIX',
    observacoes: '',
    dataCriacao: new Date('2024-12-05'),
    dataAprovacao: new Date('2024-12-06'),
    criadoPor: 'vendedor1'
  },
  { 
    id: 'ped-004', 
    tenantId: 'tenant-001', 
    numero: 2004, 
    nomeCliente: 'Cliente Balcão',
    itens: [
      { produtoId: 'prod-007', quantidade: 10, precoUnitario: 28, desconto: 0, total: 280 }
    ], 
    subtotal: 280, 
    desconto: 0, 
    total: 280, 
    status: 'pendente',
    condicaoPagamento: 'Dinheiro',
    observacoes: 'Retira no local',
    dataCriacao: new Date('2024-12-09'),
    criadoPor: 'vendedor1'
  },
  { 
    id: 'ped-005', 
    tenantId: 'tenant-001', 
    numero: 2005, 
    clienteId: 'cli-003',
    nomeCliente: 'Empresa ABC Ltda',
    itens: [
      { produtoId: 'prod-008', quantidade: 2, precoUnitario: 950, desconto: 0, total: 1900 }
    ], 
    subtotal: 1900, 
    desconto: 0, 
    total: 1900, 
    status: 'convertido',
    prazoEntrega: new Date('2024-12-10'),
    condicaoPagamento: 'Boleto 30 dias',
    observacoes: 'Convertido para venda',
    dataCriacao: new Date('2024-12-01'),
    dataAprovacao: new Date('2024-12-02'),
    vendaId: 'venda-002',
    criadoPor: 'vendedor2'
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  receitaMes: 125800,
  despesaMes: 87400,
  lucroMes: 38400,
  vendasMes: 47,
  contasPagarVencidas: 1,
  contasReceberVencidas: 1,
  estoqueCritico: 4,
  ordensServicoAbertas: 2,
  variacaoReceita: 12.5,
  variacaoDespesa: -5.2
};

export const mockPlanos: PlanoAssinatura[] = [
  { id: 'plano-001', nome: 'Básico', descricao: 'Ideal para pequenos negócios', precoMensal: 99, precoAnual: 990, recursos: [{ nome: 'Até 100 produtos', incluido: true, limite: 100 }, { nome: 'Até 2 usuários', incluido: true, limite: 2 }, { nome: 'Emissão de NF-e', incluido: true }, { nome: 'Suporte por email', incluido: true }, { nome: 'API de integração', incluido: false }, { nome: 'Multi-empresa', incluido: false }], limiteProdutos: 100, limiteUsuarios: 2, limiteVendas: 500, suporte: 'email' },
  { id: 'plano-002', nome: 'Profissional', descricao: 'Para empresas em crescimento', precoMensal: 199, precoAnual: 1990, recursos: [{ nome: 'Até 1000 produtos', incluido: true, limite: 1000 }, { nome: 'Até 5 usuários', incluido: true, limite: 5 }, { nome: 'Emissão de NF-e/NFC-e', incluido: true }, { nome: 'Suporte por chat', incluido: true }, { nome: 'API de integração', incluido: true }, { nome: 'Multi-empresa', incluido: false }], limiteProdutos: 1000, limiteUsuarios: 5, limiteVendas: 2000, suporte: 'chat' },
  { id: 'plano-003', nome: 'Enterprise', descricao: 'Para grandes operações', precoMensal: 399, precoAnual: 3990, recursos: [{ nome: 'Produtos ilimitados', incluido: true }, { nome: 'Usuários ilimitados', incluido: true }, { nome: 'Emissão de NF-e/NFC-e/NFSe', incluido: true }, { nome: 'Suporte prioritário', incluido: true }, { nome: 'API de integração', incluido: true }, { nome: 'Multi-empresa', incluido: true }], limiteProdutos: 999999, limiteUsuarios: 999999, limiteVendas: 999999, suporte: 'prioritario' },
];

export const mockTenantsAdmin: Tenant[] = [
  mockTenant,
  { id: 'tenant-002', nome: 'Tech Solutions SA', cnpj: '98.765.432/0001-10', email: 'contato@techsolutions.com', telefone: '(21) 98888-7777', endereco: { logradouro: 'Av. Rio Branco', numero: '500', complemento: '', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-000' }, plano: 'enterprise', status: 'ativo', dataCriacao: new Date('2024-02-15'), dataExpiracao: new Date('2025-02-15'), configuracoes: { corTema: '#059669', logoUrl: '', moeda: 'BRL', timezone: 'America/Sao_Paulo', nfSerie: 1, nfNumeroAtual: 500 } },
  { id: 'tenant-003', nome: 'Comércio Express ME', cnpj: '45.678.901/0001-23', email: 'financeiro@comercioexpress.com', telefone: '(31) 97777-6666', endereco: { logradouro: 'Rua da Bahia', numero: '200', complemento: '', bairro: 'Centro', cidade: 'Belo Horizonte', estado: 'MG', cep: '30160-000' }, plano: 'basico', status: 'expirado', dataCriacao: new Date('2024-06-01'), dataExpiracao: new Date('2024-12-01'), configuracoes: { corTema: '#dc2626', logoUrl: '', moeda: 'BRL', timezone: 'America/Sao_Paulo', nfSerie: 1, nfNumeroAtual: 200 } },
  { id: 'tenant-004', nome: 'Indústria Modelo LTDA', cnpj: '67.890.123/0001-45', email: 'admin@industriamodelo.com', telefone: '(41) 96666-5555', endereco: { logradouro: 'Rua da Indústria', numero: '1000', complemento: '', bairro: 'Industrial', cidade: 'Curitiba', estado: 'PR', cep: '81000-000' }, plano: 'profissional', status: 'suspenso', dataCriacao: new Date('2024-03-10'), dataExpiracao: new Date('2025-03-10'), configuracoes: { corTema: '#7c3aed', logoUrl: '', moeda: 'BRL', timezone: 'America/Sao_Paulo', nfSerie: 1, nfNumeroAtual: 800 } },
];

export const salesChartData = [
  { name: 'Jan', receita: 85000, despesas: 62000 },
  { name: 'Fev', receita: 92000, despesas: 58000 },
  { name: 'Mar', receita: 78000, despesas: 65000 },
  { name: 'Abr', receita: 105000, despesas: 70000 },
  { name: 'Mai', receita: 98000, despesas: 72000 },
  { name: 'Jun', receita: 115000, despesas: 80000 },
  { name: 'Jul', receita: 125000, despesas: 85000 },
  { name: 'Ago', receita: 132000, despesas: 88000 },
  { name: 'Set', receita: 118000, despesas: 78000 },
  { name: 'Out', receita: 142000, despesas: 92000 },
  { name: 'Nov', receita: 138000, despesas: 85000 },
  { name: 'Dez', receita: 125800, despesas: 87400 },
];

export const fluxoCaixaData = [
  { name: 'Semana 1', entradas: 28000, saidas: 15000, saldo: 13000 },
  { name: 'Semana 2', entradas: 35000, saidas: 22000, saldo: 26000 },
  { name: 'Semana 3', entradas: 42000, saidas: 28000, saldo: 40000 },
  { name: 'Semana 4', entradas: 20800, saidas: 22400, saldo: 38400 },
];
