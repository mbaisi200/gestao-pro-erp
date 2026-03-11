import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Tenant, Produto, Categoria, ContaPagar, ContaReceber, Venda, Pedido, Cliente, NotaFiscal, OrdemServico, Vendedor } from '@/types';

// ========== VERIFICAÇÃO DE EXPIRAÇÃO ==========

/**
 * Verifica se o tenant está expirado (1 dia após vencimento)
 */
export function isTenantExpired(dataExpiracao: Date): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataVencimento = new Date(dataExpiracao);
  dataVencimento.setHours(0, 0, 0, 0);
  
  // Adiciona 1 dia de tolerância após vencimento
  const dataBloqueio = new Date(dataVencimento);
  dataBloqueio.setDate(dataBloqueio.getDate() + 1);
  
  return hoje > dataBloqueio;
}

/**
 * Verifica se o tenant está no período de tolerância (dia do vencimento)
 */
export function isTenantInGracePeriod(dataExpiracao: Date): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataVencimento = new Date(dataExpiracao);
  dataVencimento.setHours(0, 0, 0, 0);
  
  return hoje.getTime() === dataVencimento.getTime();
}

/**
 * Calcula dias até expiração
 */
export function daysUntilExpiration(dataExpiracao: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataVencimento = new Date(dataExpiracao);
  dataVencimento.setHours(0, 0, 0, 0);
  
  const diffTime = dataVencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// ========== CRUD TENANTS ==========

export async function getAllTenants(): Promise<Tenant[]> {
  const tenantsCollection = collection(db, 'tenants');
  const q = query(tenantsCollection, orderBy('dataCriacao', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataExpiracao: data.dataExpiracao?.toDate() || new Date()
    } as Tenant;
  });
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const docRef = doc(db, 'tenants', tenantId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataExpiracao: data.dataExpiracao?.toDate() || new Date()
    } as Tenant;
  }
  return null;
}

export async function createTenant(tenant: Tenant): Promise<void> {
  const docRef = doc(db, 'tenants', tenant.id);
  await setDoc(docRef, {
    ...tenant,
    dataCriacao: serverTimestamp(),
    dataExpiracao: Timestamp.fromDate(tenant.dataExpiracao)
  });
}

export async function updateTenant(tenantId: string, data: Partial<Tenant>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.dataExpiracao) {
    updateData.dataExpiracao = Timestamp.fromDate(data.dataExpiracao);
  }
  await updateDoc(docRef, updateData);
}

/**
 * Delete tenant using API route (with Firebase Admin SDK - bypasses security rules)
 * This is the preferred method for production
 */
export async function deleteTenantViaAPI(tenantId: string, idToken: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/admin/delete-tenant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, idToken }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao chamar API de exclusão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com o servidor'
    };
  }
}

/**
 * Delete tenant directly via Firestore client SDK
 * Requires proper Firestore security rules to be configured
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  // Deletar todas as subcoleções primeiro
  const subcollections = [
    'produtos', 'categorias', 'contasPagar', 'contasReceber', 'vendas', 'pedidos',
    'clientes', 'notasFiscais', 'ordensServico', 'vendedores', 'fornecedores',
    'unidadesMedida', 'funcionarios', 'usuarios', 'estoque'
  ];

  console.log('Iniciando exclusão do tenant:', tenantId);

  for (const subcol of subcollections) {
    const colRef = collection(db, 'tenants', tenantId, subcol);
    const docs = await getDocs(colRef);

    // Deletar em batches de 500 (limite do Firestore)
    const batchSize = 500;
    for (let i = 0; i < docs.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.docs.slice(i, i + batchSize);
      batchDocs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log(`Subcoleção ${subcol} excluída: ${docs.docs.length} documentos`);
  }

  // Deletar o tenant
  await deleteDoc(doc(db, 'tenants', tenantId));
  console.log('Tenant excluído:', tenantId);
}

export async function updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId);
  await updateDoc(docRef, { status });
}

// ========== GERADOR DE DADOS MOCK ==========

// Dados para geração aleatória
const nomesEmpresas = [
  'Tech Solutions', 'Comércio Express', 'Indústria Modelo', 'Loja Digital', 'Supermercado Preço Bom',
  'Farmácia Saúde', 'Auto Peças Silva', 'Pet Shop Amigo', 'Restaurante Sabor', 'Café & Cia',
  'Livraria Cultural', 'Escola Futuro', 'Clínica Bem Estar', 'Academia Fitness', 'Salão Beleza',
  'Oficina Mecânica', 'Construtora Prime', 'Imobiliária Nova', 'Advocacia Silva', 'Contabilidade XYZ',
  'Gráfica Rápida', 'Informática Total', 'Celular World', 'Moveis Premium', 'Decoração & Arte',
  'Floricultura Jardim', 'Papelaria Estudo', 'Brinquedos Kids', 'Calçados Comfort', 'Confecção Moda',
  'Padaria Pão Quente', 'Lanches Gourmet', 'Pizzaria Italia', 'Sushi Bar', 'Churrascaria Gaúcha',
  'Hamburgueria Craft', 'Sorveteria Gelato', 'Bar do Zé', 'Adega Premium', 'Cervejaria Artesanal'
];

const cidadesEstados = [
  { cidade: 'São Paulo', estado: 'SP' },
  { cidade: 'Rio de Janeiro', estado: 'RJ' },
  { cidade: 'Belo Horizonte', estado: 'MG' },
  { cidade: 'Curitiba', estado: 'PR' },
  { cidade: 'Porto Alegre', estado: 'RS' },
  { cidade: 'Salvador', estado: 'BA' },
  { cidade: 'Fortaleza', estado: 'CE' },
  { cidade: 'Brasília', estado: 'DF' },
  { cidade: 'Recife', estado: 'PE' },
  { cidade: 'Campinas', estado: 'SP' },
  { cidade: 'Goiânia', estado: 'GO' },
  { cidade: 'Ribeirão Preto', estado: 'SP' },
  { cidade: 'Florianópolis', estado: 'SC' },
  { cidade: 'Joinville', estado: 'SC' },
  { cidade: 'Vitória', estado: 'ES' }
];

const logradouros = [
  'Rua das Flores', 'Av. Brasil', 'Rua Principal', 'Av. Paulista', 'Rua Central',
  'Av. Rio Branco', 'Rua do Comércio', 'Av. Independência', 'Rua 15 de Novembro', 'Av. São Francisco'
];

const bairros = [
  'Centro', 'Vila Nova', 'Jardins', 'Boa Vista', 'Santa Cruz',
  'Industrial', 'Jardim América', 'Vila Maria', 'Santo Antônio', 'São Pedro'
];

const nomesCategorias = ['Eletrônicos', 'Informática', 'Acessórios', 'Escritório', 'Utilidades', 'Roupas', 'Calçados', 'Alimentos', 'Bebidas', 'Limpeza'];

const nomesProdutos = [
  'Smartphone Galaxy', 'Notebook Dell', 'Mouse Wireless', 'Teclado Mecânico', 'Monitor LED',
  'Headset Gamer', 'Webcam HD', 'Impressora Laser', 'Pen Drive 64GB', 'SSD 480GB',
  'Memória RAM 16GB', 'Cabo HDMI', 'Carregador Turbo', 'Power Bank', 'Fone Bluetooth',
  'Smartwatch', 'Tablet Android', 'Projetor LED', 'Estabilizador', 'Nobreak'
];

const nomesClientes = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
  'Juliana Lima', 'Fernando Pereira', 'Camila Rodrigues', 'Lucas Almeida', 'Patricia Ferreira',
  'Ricardo Gomes', 'Amanda Nunes', 'Bruno Martins', 'Carolina Ribeiro', 'Diego Fernandes',
  'Eduarda Lopes', 'Felipe Carvalho', 'Gabriela Moreira', 'Henrique Barbosa', 'Isabela Rocha'
];

const descricoesContasPagar = [
  'Fornecedor de Mercadorias', 'Aluguel do Imóvel', 'Energia Elétrica', 'Telefone/Internet',
  'Água', 'Folha de Pagamento', 'Impostos', 'Manutenção', 'Marketing', 'Serviços Contábeis'
];

const descricoesContasReceber = [
  'Venda de Produtos', 'Prestação de Serviços', 'Consultoria', 'Manutenção Mensal',
  'Projeto Especial', 'Contrato de Suporte', 'Licença de Software', 'Aluguel de Equipamentos'
];

// Função para gerar CNPJ válido
function gerarCNPJ(): string {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = 0;
  const n10 = 0;
  const n11 = 0;
  const n12 = 1;
  
  // Cálculo do primeiro dígito verificador
  let d1 = n12*2 + n11*3 + n10*4 + n9*5 + n8*6 + n7*7 + n6*8 + n5*9 + n4*2 + n3*3 + n2*4 + n1*5;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  // Cálculo do segundo dígito verificador
  let d2 = d1*2 + n12*3 + n11*4 + n10*5 + n9*6 + n8*7 + n7*8 + n6*9 + n5*2 + n4*3 + n3*4 + n2*5 + n1*6;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}.${n3}${n4}${n5}.${n6}${n7}${n8}/${n9}${n10}${n11}${n12}-${d1}${d2}`;
}

// Função para gerar CPF válido
function gerarCPF(): string {
  const n = () => Math.floor(Math.random() * 10);
  const n1 = n(), n2 = n(), n3 = n(), n4 = n(), n5 = n(), n6 = n(), n7 = n(), n8 = n(), n9 = n();
  
  let d1 = n9*2 + n8*3 + n7*4 + n6*5 + n5*6 + n4*7 + n3*8 + n2*9 + n1*10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1*2 + n9*3 + n8*4 + n7*5 + n6*6 + n5*7 + n4*8 + n3*9 + n2*10 + n1*11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}

// Função para gerar CEP
function gerarCEP(): string {
  return `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`;
}

// Função para gerar telefone
function gerarTelefone(): string {
  const ddd = Math.floor(Math.random() * 89) + 11;
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `(${ddd}) 9${num.toString().substring(0, 4)}-${num.toString().substring(4)}`;
}

// Função para escolher item aleatório
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Função para gerar data aleatória dentro de um período
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Função para gerar preço aleatório
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ========== FUNÇÃO PRINCIPAL DE POPULAR DADOS ==========

export interface PopulateOptions {
  tenantId: string;
  numProdutos: number;
  numClientes: number;
  numVendedores: number;
  numContasPagar: number;
  numContasReceber: number;
  numVendas: number;
  numPedidos: number;
  numOrdensServico: number;
  dataInicio: Date;
  dataFim: Date;
}

export async function populateTenantData(options: PopulateOptions): Promise<void> {
  const {
    tenantId,
    numProdutos,
    numClientes,
    numVendedores,
    numContasPagar,
    numContasReceber,
    numVendas,
    numPedidos,
    numOrdensServico,
    dataInicio,
    dataFim
  } = options;

  console.log('populateTenantData iniciado para tenant:', tenantId);

  try {
    // 1. Limpar dados existentes
    console.log('Limpando dados existentes...');
    await clearTenantData(tenantId);
    console.log('Dados existentes limpos');

    // 2. Criar categorias e produtos em batch
    const batch = writeBatch(db);
    
    // Criar Categorias
    console.log('Criando categorias...');
    const categorias: Categoria[] = [];
    for (let i = 0; i < 10; i++) {
      const categoriaId = `cat-${tenantId}-${i}`;
      const categoria: Categoria = {
        id: categoriaId,
        tenantId,
        nome: nomesCategorias[i],
        descricao: `Categoria de ${nomesCategorias[i]}`,
        cor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        ativa: true
      };
      categorias.push(categoria);
      
      const catRef = doc(db, 'tenants', tenantId, 'categorias', categoriaId);
      batch.set(catRef, categoria);
    }
    console.log('Categorias preparadas:', categorias.length);

    // Criar Produtos
    console.log('Criando produtos...');
    const produtos: Produto[] = [];
    for (let i = 0; i < numProdutos; i++) {
      const produtoId = `prod-${tenantId}-${i}`;
      const precoCusto = randomPrice(50, 2000);
      const precoVenda = precoCusto * randomPrice(1.2, 1.8);
      
      const produto: Produto = {
        id: produtoId,
        tenantId,
        codigo: `PRD${String(i + 1).padStart(4, '0')}`,
        nome: `${randomItem(nomesProdutos)} ${i + 1}`,
        descricao: `Produto de teste número ${i + 1}`,
        categoriaId: randomItem(categorias).id,
        ncm: '8517.12.31',
        cst: '000',
        cfop: '5102',
        unidade: 'UN',
        precoCusto,
        precoVenda: Math.round(precoVenda * 100) / 100,
        estoqueAtual: Math.floor(Math.random() * 100) + 1,
        estoqueMinimo: Math.floor(Math.random() * 10) + 1,
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      };
      produtos.push(produto);
      
      const prodRef = doc(db, 'tenants', tenantId, 'produtos', produtoId);
      batch.set(prodRef, {
        ...produto,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });
    }
    console.log('Produtos preparados:', produtos.length);

    // Criar Clientes
    console.log('Criando clientes...');
    const clientes: Cliente[] = [];
    for (let i = 0; i < numClientes; i++) {
      const clienteId = `cli-${tenantId}-${i}`;
      const localizacao = randomItem(cidadesEstados);
      
      const cliente: Cliente = {
        id: clienteId,
        tenantId,
        nome: `${randomItem(nomesClientes)} ${i + 1}`,
        cpfCnpj: i % 3 === 0 ? gerarCNPJ() : gerarCPF(),
        email: `cliente${i + 1}@email.com`,
        telefone: gerarTelefone(),
        endereco: {
          logradouro: randomItem(logradouros),
          numero: String(Math.floor(Math.random() * 2000) + 1),
          complemento: i % 2 === 0 ? `Sala ${i + 1}` : '',
          bairro: randomItem(bairros),
          cidade: localizacao.cidade,
          estado: localizacao.estado,
          cep: gerarCEP()
        },
        observacoes: '',
        ativo: true
      };
      clientes.push(cliente);
      
      const cliRef = doc(db, 'tenants', tenantId, 'clientes', clienteId);
      batch.set(cliRef, cliente);
    }
    console.log('Clientes preparados:', clientes.length);

    // Criar Vendedores (sem hash de senha para evitar erros)
    console.log('Criando vendedores...');
    const vendedores: Vendedor[] = [];
    const nomesVendedores = ['Carlos Silva', 'Ana Vendedora', 'Pedro Santos', 'Maria Oliveira', 'João Costa', 'Juliana Sales', 'Fernando Lima', 'Camila Ferreira'];
    
    for (let i = 0; i < numVendedores; i++) {
      const vendedorId = `vend-${tenantId}-${i}`;
      const nomeVendedor = nomesVendedores[i % nomesVendedores.length];
      
      const vendedor: Vendedor = {
        id: vendedorId,
        tenantId,
        nome: `${nomeVendedor} ${i + 1}`,
        email: `vendedor${i + 1}@empresa.com`,
        telefone: gerarTelefone(),
        cpf: gerarCPF(),
        senha: '123456', // Senha simples para teste
        comissao: randomPrice(1, 5),
        metaVendas: randomPrice(10000, 50000),
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      };
      vendedores.push(vendedor);
      
      const vendRef = doc(db, 'tenants', tenantId, 'vendedores', vendedorId);
      batch.set(vendRef, {
        ...vendedor,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });
    }
    console.log('Vendedores preparados:', vendedores.length);

    // Commit do batch inicial
    console.log('Commitando batch inicial...');
    await batch.commit();
    console.log('Batch inicial commitado com sucesso');

    // Criar Contas a Pagar
    console.log('Criando contas a pagar...');
    for (let i = 0; i < numContasPagar; i++) {
      const contaId = `cp-${tenantId}-${i}`;
      const vencimento = randomDate(dataInicio, dataFim);
      const valor = randomPrice(100, 10000);
      const paga = Math.random() > 0.3;
      
      const conta: ContaPagar = {
        id: contaId,
        tenantId,
        descricao: randomItem(descricoesContasPagar),
        valor,
        vencimento,
        dataPagamento: paga ? new Date(vencimento.getTime() - Math.random() * 86400000 * 3) : undefined,
        status: paga ? 'pago' : (vencimento < new Date() ? 'vencido' : 'pendente'),
        categoria: 'Despesas',
        observacoes: '',
        recorrente: Math.random() > 0.7
      };
      
      const contaRef = doc(db, 'tenants', tenantId, 'contasPagar', contaId);
      await setDoc(contaRef, {
        ...conta,
        vencimento: Timestamp.fromDate(vencimento),
        dataPagamento: conta.dataPagamento ? Timestamp.fromDate(conta.dataPagamento) : null
      });
    }
    console.log('Contas a pagar criadas:', numContasPagar);

    // Criar Contas a Receber
    console.log('Criando contas a receber...');
    for (let i = 0; i < numContasReceber; i++) {
      const contaId = `cr-${tenantId}-${i}`;
      const vencimento = randomDate(dataInicio, dataFim);
      const valor = randomPrice(100, 15000);
      const recebida = Math.random() > 0.3;
      
      const conta: ContaReceber = {
        id: contaId,
        tenantId,
        descricao: randomItem(descricoesContasReceber),
        valor,
        vencimento,
        dataRecebimento: recebida ? new Date(vencimento.getTime() - Math.random() * 86400000 * 3) : undefined,
        status: recebida ? 'recebido' : (vencimento < new Date() ? 'vencido' : 'pendente'),
        categoria: 'Receitas',
        clienteId: randomItem(clientes).id,
        observacoes: ''
      };
      
      const contaRef = doc(db, 'tenants', tenantId, 'contasReceber', contaId);
      await setDoc(contaRef, {
        ...conta,
        vencimento: Timestamp.fromDate(vencimento),
        dataRecebimento: conta.dataRecebimento ? Timestamp.fromDate(conta.dataRecebimento) : null
      });
    }
    console.log('Contas a receber criadas:', numContasReceber);

    // Criar Vendas
    console.log('Criando vendas...');
    for (let i = 0; i < numVendas; i++) {
      const vendaId = `venda-${tenantId}-${i}`;
      const cliente = randomItem(clientes);
      const vendedor = vendedores.length > 0 ? randomItem(vendedores) : null;
      const numItens = Math.floor(Math.random() * 4) + 1;
      
      const itens = [];
      let total = 0;
      
      for (let j = 0; j < numItens; j++) {
        const produto = randomItem(produtos);
        const quantidade = Math.floor(Math.random() * 5) + 1;
        const precoUnitario = produto.precoVenda;
        const itemTotal = quantidade * precoUnitario;
        
        itens.push({
          produtoId: produto.id,
          quantidade,
          precoUnitario,
          desconto: 0,
          total: itemTotal
        });
        total += itemTotal;
      }
      
      const valorComissao = vendedor ? total * (vendedor.comissao / 100) : 0;
      const dataVenda = randomDate(dataInicio, dataFim);
      
      const vendaData: Record<string, any> = {
        id: vendaId,
        tenantId,
        numero: 1000 + i,
        clienteId: cliente.id,
        itens,
        subtotal: total,
        desconto: 0,
        total,
        formaPagamento: randomItem(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto']),
        status: 'concluida',
        dataVenda: Timestamp.fromDate(dataVenda),
        observacoes: '',
        valorComissao
      };
      
      // Só adiciona vendedorId se existir
      if (vendedor?.id) {
        vendaData.vendedorId = vendedor.id;
      }
      
      const vendaRef = doc(db, 'tenants', tenantId, 'vendas', vendaId);
      await setDoc(vendaRef, vendaData);
    }
    console.log('Vendas criadas:', numVendas);

    // Criar Pedidos
    console.log('Criando pedidos...');
    for (let i = 0; i < numPedidos; i++) {
      const pedidoId = `ped-${tenantId}-${i}`;
      const clientePedido = Math.random() > 0.2 ? randomItem(clientes) : null;
      const vendedor = vendedores.length > 0 ? randomItem(vendedores) : null;
      const numItens = Math.floor(Math.random() * 3) + 1;
      
      const itens = [];
      let total = 0;
      
      for (let j = 0; j < numItens; j++) {
        const produto = randomItem(produtos);
        const quantidade = Math.floor(Math.random() * 5) + 1;
        const precoUnitario = produto.precoVenda;
        const itemTotal = quantidade * precoUnitario;
        
        itens.push({
          produtoId: produto.id,
          quantidade,
          precoUnitario,
          desconto: 0,
          total: itemTotal
        });
        total += itemTotal;
      }
      
      const status = randomItem(['pendente', 'pendente', 'aprovado', 'convertido', 'cancelado']);
      const dataCriacao = randomDate(dataInicio, dataFim);
      
      const pedidoData: Record<string, any> = {
        id: pedidoId,
        tenantId,
        numero: 2000 + i,
        nomeCliente: clientePedido?.nome || 'Cliente Balcão',
        itens,
        subtotal: total,
        desconto: 0,
        total,
        status,
        condicaoPagamento: randomItem(['À vista', '30 dias', '30/60 dias', 'PIX']),
        observacoes: '',
        dataCriacao: Timestamp.fromDate(dataCriacao),
        criadoPor: vendedor?.id || 'admin'
      };
      
      // Só adiciona clienteId se existir
      if (clientePedido?.id) {
        pedidoData.clienteId = clientePedido.id;
      }
      
      // Só adiciona vendedorId se existir
      if (vendedor?.id) {
        pedidoData.vendedorId = vendedor.id;
      }
      
      const pedidoRef = doc(db, 'tenants', tenantId, 'pedidos', pedidoId);
      await setDoc(pedidoRef, pedidoData);
    }
    console.log('Pedidos criados:', numPedidos);

    // Criar Ordens de Serviço
    console.log('Criando ordens de serviço...');
    for (let i = 0; i < numOrdensServico; i++) {
      const osId = `os-${tenantId}-${i}`;
      const cliente = randomItem(clientes);
      const dataAbertura = randomDate(dataInicio, dataFim);
      const valorServico = randomPrice(100, 500);
      
      const ordemServico: OrdemServico = {
        id: osId,
        tenantId,
        numero: 100 + i,
        clienteId: cliente.id,
        cliente,
        descricao: `Ordem de serviço ${i + 1} - ${randomItem(['Manutenção', 'Instalação', 'Reparo', 'Consultoria'])}`,
        servicos: [{
          descricao: 'Serviço técnico',
          quantidade: 1,
          valorUnitario: valorServico,
          total: valorServico
        }],
        valorServicos: valorServico,
        valorProdutos: 0,
        valorTotal: valorServico,
        status: randomItem(['aberta', 'em_andamento', 'concluida']),
        dataAbertura,
        observacoes: ''
      };
      
      const osRef = doc(db, 'tenants', tenantId, 'ordensServico', osId);
      await setDoc(osRef, {
        ...ordemServico,
        dataAbertura: Timestamp.fromDate(dataAbertura)
      });
    }
    console.log('Ordens de serviço criadas:', numOrdensServico);

    console.log('populateTenantData concluído com sucesso!');
  } catch (error) {
    console.error('Erro em populateTenantData:', error);
    throw error;
  }
}

// ========== LIMPAR DADOS DO TENANT ==========

export async function clearTenantData(tenantId: string): Promise<void> {
  const subcollections = ['produtos', 'categorias', 'contasPagar', 'contasReceber', 'vendas', 'pedidos', 'clientes', 'notasFiscais', 'ordensServico', 'vendedores'];
  
  for (const subcol of subcollections) {
    const colRef = collection(db, 'tenants', tenantId, subcol);
    const docs = await getDocs(colRef);
    
    // Deletar em batches de 500
    const batchSize = 500;
    for (let i = 0; i < docs.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.docs.slice(i, i + batchSize);
      batchDocs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}

// ========== CRIAR NOVO CLIENTE (TENANT) ==========

export interface NewTenantData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  plano: 'basico' | 'profissional' | 'enterprise';
  dataExpiracao: Date;
}

export async function createNewTenant(data: NewTenantData): Promise<string> {
  const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const tenant: Tenant = {
    id: tenantId,
    nome: data.nome,
    cnpj: data.cnpj,
    email: data.email,
    telefone: data.telefone,
    endereco: data.endereco,
    plano: data.plano,
    status: 'ativo',
    dataCriacao: new Date(),
    dataExpiracao: data.dataExpiracao,
    configuracoes: {
      corTema: '#2563eb',
      logoUrl: '',
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      nfSerie: 1,
      nfNumeroAtual: 1000
    }
  };
  
  await createTenant(tenant);
  
  return tenantId;
}

// ========== VERIFICAR E ATUALIZAR STATUS DE EXPIRAÇÃO ==========

export async function checkAndUpdateExpiredTenants(): Promise<number> {
  const tenants = await getAllTenants();
  let updated = 0;
  
  for (const tenant of tenants) {
    const expired = isTenantExpired(tenant.dataExpiracao);
    
    if (expired && tenant.status !== 'expirado') {
      await updateTenantStatus(tenant.id, 'expirado');
      updated++;
    }
  }
  
  return updated;
}

// ========== FUNÇÕES DE HASH DE SENHA ==========

/**
 * Hash simples de senha (em produção usar bcrypt ou similar)
 */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verifica senha
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ========== CRUD VENDEDORES ==========

export async function getVendedores(tenantId: string): Promise<Vendedor[]> {
  const colRef = collection(db, 'tenants', tenantId, 'vendedores');
  const q = query(colRef, orderBy('nome'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
      ultimoAcesso: data.ultimoAcesso?.toDate()
    } as Vendedor;
  });
}

export async function getVendedor(tenantId: string, vendedorId: string): Promise<Vendedor | null> {
  const docRef = doc(db, 'tenants', tenantId, 'vendedores', vendedorId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
      ultimoAcesso: data.ultimoAcesso?.toDate()
    } as Vendedor;
  }
  return null;
}

export async function createVendedor(tenantId: string, vendedor: Omit<Vendedor, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<string> {
  const docRef = doc(collection(db, 'tenants', tenantId, 'vendedores'));
  
  await setDoc(docRef, {
    ...vendedor,
    id: docRef.id,
    senha: hashPassword(vendedor.senha), // Hash da senha
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp()
  });
  
  return docRef.id;
}

export async function updateVendedor(tenantId: string, vendedorId: string, data: Partial<Vendedor>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'vendedores', vendedorId);
  const updateData: Record<string, unknown> = { ...data, dataAtualizacao: serverTimestamp() };
  
  // Se estiver atualizando a senha, fazer hash
  if (data.senha) {
    updateData.senha = hashPassword(data.senha);
  }
  
  await updateDoc(docRef, updateData);
}

export async function deleteVendedor(tenantId: string, vendedorId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'vendedores', vendedorId);
  await deleteDoc(docRef);
}

export async function authenticateVendedor(tenantId: string, email: string, senha: string): Promise<Vendedor | null> {
  const colRef = collection(db, 'tenants', tenantId, 'vendedores');
  const q = query(colRef, where('email', '==', email), where('ativo', '==', true));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const vendedorDoc = querySnapshot.docs[0];
  const data = vendedorDoc.data();
  
  if (!verifyPassword(senha, data.senha)) {
    return null;
  }
  
  // Atualizar último acesso
  await updateDoc(vendedorDoc.ref, { ultimoAcesso: serverTimestamp() });
  
  return {
    ...data,
    id: vendedorDoc.id,
    dataCriacao: data.dataCriacao?.toDate() || new Date(),
    dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
    ultimoAcesso: new Date()
  } as Vendedor;
}

// ========== RELATÓRIO DE VENDAS POR VENDEDOR ==========

export interface VendedorRelatorio {
  vendedorId: string;
  vendedorNome: string;
  totalVendas: number;
  valorTotal: number;
  valorComissao: number;
  metasAtingidas: number;
  vendas: Venda[];
}

export async function getRelatorioVendedores(
  tenantId: string, 
  dataInicio: Date, 
  dataFim: Date
): Promise<VendedorRelatorio[]> {
  // Buscar vendedores
  const vendedores = await getVendedores(tenantId);
  
  // Buscar vendas no período
  const vendasRef = collection(db, 'tenants', tenantId, 'vendas');
  const q = query(vendasRef, orderBy('dataVenda'));
  const querySnapshot = await getDocs(q);
  
  const vendas = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataVenda: data.dataVenda?.toDate() || new Date()
    } as Venda;
  }).filter(v => {
    const dataVenda = v.dataVenda;
    return dataVenda >= dataInicio && dataVenda <= dataFim && v.status === 'concluida';
  });
  
  // Agrupar por vendedor
  const relatorios: VendedorRelatorio[] = vendedores.map(v => {
    const vendasVendedor = vendas.filter(venda => venda.vendedorId === v.id);
    const valorTotal = vendasVendedor.reduce((acc, v) => acc + v.total, 0);
    
    return {
      vendedorId: v.id,
      vendedorNome: v.nome,
      totalVendas: vendasVendedor.length,
      valorTotal,
      valorComissao: valorTotal * (v.comissao / 100),
      metasAtingidas: valorTotal >= v.metaVendas ? 1 : 0,
      vendas: vendasVendedor
    };
  });
  
  // Adicionar vendas sem vendedor
  const vendasSemVendedor = vendas.filter(v => !v.vendedorId);
  if (vendasSemVendedor.length > 0) {
    relatorios.push({
      vendedorId: 'sem-vendedor',
      vendedorNome: 'Sem Vendedor',
      totalVendas: vendasSemVendedor.length,
      valorTotal: vendasSemVendedor.reduce((acc, v) => acc + v.total, 0),
      valorComissao: 0,
      metasAtingidas: 0,
      vendas: vendasSemVendedor
    });
  }
  
  return relatorios.sort((a, b) => b.valorTotal - a.valorTotal);
}

// ========== GERENCIAR USUÁRIO DA EMPRESA ==========

/**
 * Criar ou atualizar usuário no Firebase Auth via API
 */
export async function manageTenantUser(
  tenantId: string,
  email: string,
  password: string,
  nome: string,
  idToken: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/admin/manage-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        email,
        password,
        nome,
        idToken,
        action: 'create-user',
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao gerenciar usuário:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com o servidor',
    };
  }
}

/**
 * Verificar se usuário existe no Firebase Auth
 */
export async function checkUserExists(email: string, idToken: string): Promise<{ exists: boolean; displayName?: string }> {
  try {
    const response = await fetch('/api/admin/manage-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        idToken,
        action: 'check-user',
      }),
    });

    const data = await response.json();
    return { exists: data.exists, displayName: data.displayName };
  } catch {
    return { exists: false };
  }
}
