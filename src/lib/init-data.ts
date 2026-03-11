import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Tenant ID para o usuário de teste
export const TEST_TENANT_ID = 'tenant-teste-001';
export const TEST_UID = 'YFckLtcLfETLPOVEZ1nHTKaEPKq2';
export const ADMIN_UID = 'GbjBSamLs7NlgwHkLxT17n89ECn2';

/**
 * Verifica se os dados já existem
 */
export async function checkTestDataExists(): Promise<boolean> {
  try {
    const tenantRef = doc(db, 'tenants', TEST_TENANT_ID);
    const tenantSnap = await getDoc(tenantRef);
    return tenantSnap.exists();
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return false;
  }
}

/**
 * Limpa todos os dados do tenant de teste
 */
export async function clearTestData(): Promise<void> {
  console.log('Limpando dados do usuário de teste...');
  
  try {
    // Lista de subcoleções para limpar
    const subcollections = [
      'categorias',
      'produtos', 
      'clientes',
      'fornecedores',
      'funcionarios',
      'contasPagar',
      'contasReceber',
      'vendas',
      'pedidos',
      'ordensServico',
      'notasFiscais',
      'movimentacoesEstoque'
    ];

    // Limpar cada subcoleção
    for (const subcol of subcollections) {
      const colRef = collection(db, 'tenants', TEST_TENANT_ID, subcol);
      const snapshot = await getDocs(colRef);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`✓ ${subcol}: ${snapshot.docs.length} documentos removidos`);
      }
    }

    // Remover o tenant e usuários
    await deleteDoc(doc(db, 'tenants', TEST_TENANT_ID));
    await deleteDoc(doc(db, 'users', TEST_UID));
    
    console.log('🎉 Dados limpos com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  }
}

/**
 * Inicializa todos os dados do usuário de teste no Firebase
 */
export async function initializeTestUserData(): Promise<void> {
  console.log('Inicializando dados do usuário de teste...');
  
  try {
    const batch = writeBatch(db);
    
    // 1. Criar o Tenant com campos atualizados
    const tenantRef = doc(db, 'tenants', TEST_TENANT_ID);
    batch.set(tenantRef, {
      id: TEST_TENANT_ID,
      nome: 'Empresa Teste LTDA',
      cnpj: '11.222.333/0001-44',
      email: 'teste@teste.com',
      telefone: '(11) 99999-0000',
      endereco: {
        logradouro: 'Rua de Teste',
        numero: '123',
        complemento: 'Sala 1',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000-000'
      },
      plano: 'profissional',
      status: 'ativo',
      dataCriacao: serverTimestamp(),
      dataExpiracao: Timestamp.fromDate(new Date('2025-12-31')),
      inscricaoEstadual: '123.456.789.123',
      inscricaoMunicipal: '123456',
      regimeTributario: 'simples',
      cnae: '6201-5/01',
      configuracoes: {
        corTema: '#2563eb',
        logoUrl: '',
        moeda: 'BRL',
        timezone: 'America/Sao_Paulo',
        nfSerie: 1,
        nfNumeroAtual: 1000
      }
    });

    // 2. Criar usuário de teste
    const userRef = doc(db, 'users', TEST_UID);
    batch.set(userRef, {
      uid: TEST_UID,
      email: 'teste@teste.com',
      nome: 'Usuário Teste',
      role: 'gerente',
      tenantId: TEST_TENANT_ID,
      ativo: true,
      criadoEm: serverTimestamp()
    });

    // 3. Criar usuário admin master
    const adminRef = doc(db, 'users', ADMIN_UID);
    batch.set(adminRef, {
      uid: ADMIN_UID,
      email: 'baisinextel@gmail.com',
      nome: 'Administrador Master',
      role: 'admin',
      tenantId: 'admin-master',
      ativo: true,
      criadoEm: serverTimestamp()
    });

    // Commit do batch inicial
    await batch.commit();
    console.log('✓ Tenant e usuários criados');

    // 4. Criar Categorias
    const categorias = [
      { id: 'cat-001', nome: 'Eletrônicos', descricao: 'Produtos eletrônicos', cor: '#3b82f6', ativa: true },
      { id: 'cat-002', nome: 'Acessórios', descricao: 'Acessórios diversos', cor: '#10b981', ativa: true },
      { id: 'cat-003', nome: 'Informática', descricao: 'Produtos de informática', cor: '#f59e0b', ativa: true },
      { id: 'cat-004', nome: 'Escritório', descricao: 'Materiais de escritório', cor: '#8b5cf6', ativa: true },
      { id: 'cat-005', nome: 'Serviços', descricao: 'Serviços prestados', cor: '#ec4899', ativa: true },
    ];

    for (const categoria of categorias) {
      const catRef = doc(db, 'tenants', TEST_TENANT_ID, 'categorias', categoria.id);
      await setDoc(catRef, { ...categoria, tenantId: TEST_TENANT_ID });
    }
    console.log('✓ Categorias criadas');

    // 5. Criar Fornecedores
    const fornecedores = [
      {
        id: 'forn-001',
        nome: 'Samsung Brasil',
        razaoSocial: 'Samsung Eletrônica da Amazônia Ltda',
        cnpj: '00.000.000/0001-00',
        inscricaoEstadual: '123.456.789.123',
        email: 'comercial@samsung.com',
        telefone: '(11) 3003-0000',
        endereco: { logradouro: 'Av. Industrial', numero: '1000', complemento: '', bairro: 'Industrial', cidade: 'Manaus', estado: 'AM', cep: '69000-000' },
        contato: 'João Comprador',
        cargo: 'Gerente Comercial',
        dadosBancarios: { banco: '001', agencia: '0001', conta: '12345-6', tipoConta: 'corrente', pix: 'samsung@pix.com' },
        categorias: ['cat-001'],
        ativo: true
      },
      {
        id: 'forn-002',
        nome: 'Dell Computadores',
        razaoSocial: 'Dell Computadores do Brasil Ltda',
        cnpj: '11.111.111/0001-11',
        inscricaoEstadual: '234.567.890.123',
        email: 'vendas@dell.com',
        telefone: '(11) 3003-1111',
        endereco: { logradouro: 'Av. Paulista', numero: '500', complemento: '', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', cep: '01310-000' },
        contato: 'Maria Vendedora',
        cargo: 'Representante',
        categorias: ['cat-003'],
        ativo: true
      },
      {
        id: 'forn-003',
        nome: 'Logitech Brasil',
        razaoSocial: 'Logitech Brasil Importação Ltda',
        cnpj: '22.222.222/0001-22',
        email: 'contato@logitech.com.br',
        telefone: '(11) 3003-2222',
        endereco: { logradouro: 'Rua dos Computadores', numero: '200', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
        contato: 'Pedro Silva',
        categorias: ['cat-002'],
        ativo: true
      }
    ];

    for (const fornecedor of fornecedores) {
      const fornRef = doc(db, 'tenants', TEST_TENANT_ID, 'fornecedores', fornecedor.id);
      await setDoc(fornRef, { ...fornecedor, tenantId: TEST_TENANT_ID, dataCriacao: serverTimestamp() });
    }
    console.log('✓ Fornecedores criados');

    // 6. Criar Produtos com campos fiscais completos
    const produtos = [
      {
        id: 'prod-001', codigo: '001', codigoBarras: '7891234567890', nome: 'Smartphone Samsung Galaxy S24',
        descricao: 'Smartphone Samsung Galaxy S24 128GB', tipo: 'produto', categoriaId: 'cat-001',
        ncm: '8517.12.31', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, ipi: 0, origem: '0',
        unidade: 'UN', precoCusto: 2800, precoVenda: 3500, margemLucro: 25,
        estoqueAtual: 15, estoqueMinimo: 5, estoqueMaximo: 50,
        fornecedorId: 'forn-001', atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-002', codigo: '002', codigoBarras: '7891234567891', nome: 'Notebook Dell Inspiron 15',
        descricao: 'Notebook Dell Inspiron 15 i5 8GB 256GB SSD', tipo: 'produto', categoriaId: 'cat-003',
        ncm: '8471.30.19', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, ipi: 5, origem: '1',
        unidade: 'UN', precoCusto: 3200, precoVenda: 4200, margemLucro: 31,
        estoqueAtual: 8, estoqueMinimo: 3, estoqueMaximo: 20,
        fornecedorId: 'forn-002', atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-003', codigo: '003', codigoBarras: '7891234567892', nome: 'Mouse Logitech MX Master 3',
        descricao: 'Mouse sem fio Logitech MX Master 3', tipo: 'produto', categoriaId: 'cat-002',
        ncm: '8471.60.52', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '1',
        unidade: 'UN', precoCusto: 380, precoVenda: 520, margemLucro: 37,
        estoqueAtual: 25, estoqueMinimo: 10, estoqueMaximo: 100,
        fornecedorId: 'forn-003', atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-004', codigo: '004', nome: 'Teclado Mecânico RGB',
        descricao: 'Teclado mecânico gaming RGB Blue Switch', tipo: 'produto', categoriaId: 'cat-002',
        ncm: '8473.30.11', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 180, precoVenda: 280, margemLucro: 55,
        estoqueAtual: 3, estoqueMinimo: 5, estoqueMaximo: 30,
        atalhoPDV: false, ativo: true
      },
      {
        id: 'prod-005', codigo: '005', nome: 'Monitor LG 27" 4K',
        descricao: 'Monitor LG 27" 4K IPS 60Hz', tipo: 'produto', categoriaId: 'cat-003',
        ncm: '8528.52.29', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 1800, precoVenda: 2400, margemLucro: 33,
        estoqueAtual: 12, estoqueMinimo: 5, estoqueMaximo: 25,
        atalhoPDV: false, ativo: true
      },
      {
        id: 'prod-006', codigo: '006', nome: 'Fone Bluetooth JBL Tune',
        descricao: 'Fone de ouvido Bluetooth JBL Tune 500BT', tipo: 'produto', categoriaId: 'cat-002',
        ncm: '8518.30.00', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 180, precoVenda: 280, margemLucro: 55,
        estoqueAtual: 2, estoqueMinimo: 8, estoqueMaximo: 40,
        atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-007', codigo: '007', nome: 'Impressora HP LaserJet',
        descricao: 'Impressora HP LaserJet Pro M404dn', tipo: 'produto', categoriaId: 'cat-004',
        ncm: '8443.32.41', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 1500, precoVenda: 2100, margemLucro: 40,
        estoqueAtual: 6, estoqueMinimo: 3, estoqueMaximo: 15,
        atalhoPDV: false, ativo: true
      },
      {
        id: 'prod-008', codigo: '008', nome: 'Webcam Logitech C920',
        descricao: 'Webcam Logitech C920 HD Pro', tipo: 'produto', categoriaId: 'cat-002',
        ncm: '8525.80.19', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 350, precoVenda: 480, margemLucro: 37,
        estoqueAtual: 18, estoqueMinimo: 5, estoqueMaximo: 30,
        atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-009', codigo: '009', nome: 'SSD Kingston 480GB',
        descricao: 'SSD Kingston A400 480GB SATA', tipo: 'produto', categoriaId: 'cat-003',
        ncm: '8471.70.10', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 220, precoVenda: 320, margemLucro: 45,
        estoqueAtual: 45, estoqueMinimo: 15, estoqueMaximo: 100,
        atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-010', codigo: '010', nome: 'Memória RAM 16GB DDR4',
        descricao: 'Memória RAM 16GB DDR4 3200MHz', tipo: 'produto', categoriaId: 'cat-003',
        ncm: '8542.32.31', cst: '000', csosn: '102', cfop: '5102', icms: 18, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'UN', precoCusto: 280, precoVenda: 380, margemLucro: 35,
        estoqueAtual: 1, estoqueMinimo: 10, estoqueMaximo: 50,
        atalhoPDV: false, ativo: true
      },
      // Serviços
      {
        id: 'prod-011', codigo: 'SVC-001', nome: 'Instalação de Software',
        descricao: 'Serviço de instalação e configuração de software', tipo: 'servico', categoriaId: 'cat-005',
        ncm: '00', cst: '000', csosn: '102', cfop: '5933', icms: 0, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'HR', precoCusto: 0, precoVenda: 150, margemLucro: 100,
        estoqueAtual: 0, estoqueMinimo: 0, estoqueMaximo: 0,
        atalhoPDV: true, ativo: true
      },
      {
        id: 'prod-012', codigo: 'SVC-002', nome: 'Suporte Técnico Remoto',
        descricao: 'Atendimento técnico remoto por hora', tipo: 'servico', categoriaId: 'cat-005',
        ncm: '00', cst: '000', csosn: '102', cfop: '5933', icms: 0, pis: 0.65, cofins: 3, origem: '0',
        unidade: 'HR', precoCusto: 0, precoVenda: 80, margemLucro: 100,
        estoqueAtual: 0, estoqueMinimo: 0, estoqueMaximo: 0,
        atalhoPDV: true, ativo: true
      }
    ];

    for (const produto of produtos) {
      const prodRef = doc(db, 'tenants', TEST_TENANT_ID, 'produtos', produto.id);
      await setDoc(prodRef, {
        ...produto,
        tenantId: TEST_TENANT_ID,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });
    }
    console.log('✓ Produtos criados');

    // 7. Criar Clientes
    const clientes = [
      {
        id: 'cli-001', nome: 'João Silva', cpfCnpj: '123.456.789-00', tipoPessoa: 'fisica' as const,
        email: 'joao@email.com', telefone: '(11) 98765-4321',
        endereco: { logradouro: 'Rua A', numero: '100', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
        observacoes: 'Cliente preferencial', ativo: true
      },
      {
        id: 'cli-002', nome: 'Maria Santos', cpfCnpj: '987.654.321-00', tipoPessoa: 'fisica' as const,
        email: 'maria@email.com', telefone: '(11) 91234-5678',
        endereco: { logradouro: 'Av. B', numero: '200', complemento: 'Apto 10', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '02000-000' },
        observacoes: '', ativo: true
      },
      {
        id: 'cli-003', nome: 'Empresa ABC Ltda', cpfCnpj: '11.222.333/0001-44', tipoPessoa: 'juridica' as const,
        inscricaoEstadual: '123.456.789.123',
        email: 'contato@abc.com', telefone: '(11) 3456-7890',
        endereco: { logradouro: 'Rua C', numero: '300', complemento: '', bairro: 'Industrial', cidade: 'Campinas', estado: 'SP', cep: '13000-000' },
        observacoes: 'Cliente VIP - condições especiais', ativo: true
      },
      {
        id: 'cli-004', nome: 'Tech Solutions SA', cpfCnpj: '22.333.444/0001-55', tipoPessoa: 'juridica' as const,
        inscricaoEstadual: '234.567.890.123',
        email: 'compras@techsolutions.com', telefone: '(21) 99876-5432',
        endereco: { logradouro: 'Av. Rio Branco', numero: '500', complemento: 'Sala 501', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-000' },
        observacoes: 'Empresa do Rio', ativo: true
      }
    ];

    for (const cliente of clientes) {
      const cliRef = doc(db, 'tenants', TEST_TENANT_ID, 'clientes', cliente.id);
      await setDoc(cliRef, { ...cliente, tenantId: TEST_TENANT_ID });
    }
    console.log('✓ Clientes criados');

    // 8. Criar Funcionários
    const funcionarios = [
      {
        id: 'func-001', nome: 'Carlos Técnico', cpf: '111.222.333-44', rg: '12.345.678-9',
        email: 'carlos@empresa.com', telefone: '(11) 97777-1111',
        endereco: { logradouro: 'Rua 1', numero: '10', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
        cargo: 'Técnico', departamento: 'Suporte', salario: 3500,
        dataAdmissao: new Date('2023-01-15'), dataNascimento: new Date('1990-05-20'),
        permissoes: {
          dashboard: true, produtos: true, estoque: true, financeiro: false,
          faturamento: false, pdv: true, pedidos: true, operacional: true,
          parametros: false, admin: false, funcionarios: false, categorias: true,
          fornecedores: true, clientes: true, unidades: false, relatorios: true
        },
        senha: '$2a$10$hash_simulado', // Em produção usar bcrypt
        ativo: true, podeAcessarSistema: true, criadoPor: ADMIN_UID
      },
      {
        id: 'func-002', nome: 'Ana Vendedora', cpf: '222.333.444-55', rg: '23.456.789-0',
        email: 'ana@empresa.com', telefone: '(11) 97777-2222',
        endereco: { logradouro: 'Rua 2', numero: '20', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
        cargo: 'Vendedora', departamento: 'Comercial', salario: 2800,
        dataAdmissao: new Date('2023-06-01'), dataNascimento: new Date('1995-08-15'),
        permissoes: {
          dashboard: true, produtos: true, estoque: false, financeiro: false,
          faturamento: false, pdv: true, pedidos: true, operacional: false,
          parametros: false, admin: false, funcionarios: false, categorias: false,
          fornecedores: false, clientes: true, unidades: false, relatorios: false
        },
        senha: '$2a$10$hash_simulado',
        ativo: true, podeAcessarSistema: true, criadoPor: ADMIN_UID
      }
    ];

    for (const funcionario of funcionarios) {
      const funcRef = doc(db, 'tenants', TEST_TENANT_ID, 'funcionarios', funcionario.id);
      await setDoc(funcRef, {
        ...funcionario,
        tenantId: TEST_TENANT_ID,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });
    }
    console.log('✓ Funcionários criados');

    // 9. Criar Contas a Pagar
    const contasPagar = [
      { id: 'cp-001', descricao: 'Fornecedor Samsung - Smartphones', valor: 28000, vencimento: new Date('2024-12-25'), status: 'pendente', categoria: 'Fornecedores', fornecedorId: 'forn-001', documentoRef: 'NF 12345', recorrente: false },
      { id: 'cp-002', descricao: 'Aluguel do mês', valor: 3500, vencimento: new Date('2024-12-10'), status: 'pago', dataPagamento: new Date('2024-12-08'), categoria: 'Despesas Fixas', recorrente: true },
      { id: 'cp-003', descricao: 'Conta de Energia', valor: 850, vencimento: new Date('2024-12-15'), status: 'pago', dataPagamento: new Date('2024-12-14'), categoria: 'Utilidades', recorrente: true },
      { id: 'cp-004', descricao: 'Folha de Pagamento', valor: 25000, vencimento: new Date('2024-12-05'), status: 'pago', dataPagamento: new Date('2024-12-05'), categoria: 'Pessoal', recorrente: true },
      { id: 'cp-005', descricao: 'Internet Fibra', valor: 299, vencimento: new Date('2024-12-20'), status: 'vencido', categoria: 'Utilidades', recorrente: true },
      { id: 'cp-006', descricao: 'Fornecedor Dell - Notebooks', valor: 19200, vencimento: new Date('2024-12-28'), status: 'pendente', categoria: 'Fornecedores', fornecedorId: 'forn-002', documentoRef: 'NF 67890', recorrente: false },
    ];

    for (const conta of contasPagar) {
      const contaRef = doc(db, 'tenants', TEST_TENANT_ID, 'contasPagar', conta.id);
      await setDoc(contaRef, {
        ...conta,
        tenantId: TEST_TENANT_ID,
        vencimento: Timestamp.fromDate(conta.vencimento),
        dataPagamento: conta.dataPagamento ? Timestamp.fromDate(conta.dataPagamento) : null
      });
    }
    console.log('✓ Contas a Pagar criadas');

    // 10. Criar Contas a Receber
    const contasReceber = [
      { id: 'cr-001', descricao: 'Venda para Cliente ABC', valor: 8500, vencimento: new Date('2024-12-15'), status: 'recebido', dataRecebimento: new Date('2024-12-14'), categoria: 'Vendas', clienteId: 'cli-003' },
      { id: 'cr-002', descricao: 'Prestação de Serviços - XYZ', valor: 3200, vencimento: new Date('2024-12-25'), status: 'pendente', categoria: 'Serviços', clienteId: 'cli-004' },
      { id: 'cr-003', descricao: 'Venda parcelada - Cliente DEF', valor: 2400, vencimento: new Date('2024-12-10'), status: 'vencido', categoria: 'Vendas', clienteId: 'cli-001' },
      { id: 'cr-004', descricao: 'Manutenção mensal - Cliente GHI', valor: 1500, vencimento: new Date('2024-12-30'), status: 'pendente', categoria: 'Serviços', clienteId: 'cli-002' },
      { id: 'cr-005', descricao: 'Venda de equipamentos', valor: 12600, vencimento: new Date('2024-12-28'), status: 'pendente', categoria: 'Vendas', clienteId: 'cli-003' },
    ];

    for (const conta of contasReceber) {
      const contaRef = doc(db, 'tenants', TEST_TENANT_ID, 'contasReceber', conta.id);
      await setDoc(contaRef, {
        ...conta,
        tenantId: TEST_TENANT_ID,
        vencimento: Timestamp.fromDate(conta.vencimento),
        dataRecebimento: conta.dataRecebimento ? Timestamp.fromDate(conta.dataRecebimento) : null
      });
    }
    console.log('✓ Contas a Receber criadas');

    // 11. Criar Pedidos
    const pedidos = [
      {
        id: 'ped-001', numero: 2001, clienteId: 'cli-001', nomeCliente: 'João Silva',
        itens: [
          { produtoId: 'prod-001', quantidade: 2, precoUnitario: 3500, desconto: 0, total: 7000 },
          { produtoId: 'prod-003', quantidade: 1, precoUnitario: 520, desconto: 0, total: 520 }
        ],
        subtotal: 7520, desconto: 0, total: 7520, status: 'pendente',
        condicaoPagamento: '30/60 dias', formaPagamento: 'boleto',
        prazoEntrega: new Date('2024-12-20'),
        observacoes: 'Cliente solicita entrega no período da manhã',
        criadoPor: 'func-002'
      },
      {
        id: 'ped-002', numero: 2002, clienteId: 'cli-003', nomeCliente: 'Empresa ABC Ltda',
        itens: [
          { produtoId: 'prod-002', quantidade: 5, precoUnitario: 4200, desconto: 500, total: 20500 },
          { produtoId: 'prod-005', quantidade: 5, precoUnitario: 2400, desconto: 0, total: 12000 }
        ],
        subtotal: 33000, desconto: 500, total: 32500, status: 'pendente',
        condicaoPagamento: 'À vista', formaPagamento: 'transferencia',
        prazoEntrega: new Date('2024-12-18'),
        observacoes: 'Pedido grande - verificar disponibilidade de estoque',
        criadoPor: 'func-002'
      },
      {
        id: 'ped-003', numero: 2003, clienteId: 'cli-002', nomeCliente: 'Maria Santos',
        itens: [
          { produtoId: 'prod-004', quantidade: 1, precoUnitario: 280, desconto: 30, total: 250 },
          { produtoId: 'prod-006', quantidade: 1, precoUnitario: 280, desconto: 0, total: 280 }
        ],
        subtotal: 560, desconto: 30, total: 530, status: 'aprovado',
        condicaoPagamento: 'PIX', formaPagamento: 'pix',
        prazoEntrega: new Date('2024-12-15'),
        dataAprovacao: new Date('2024-12-06'),
        criadoPor: 'func-002'
      }
    ];

    for (const pedido of pedidos) {
      const pedidoRef = doc(db, 'tenants', TEST_TENANT_ID, 'pedidos', pedido.id);
      await setDoc(pedidoRef, {
        ...pedido,
        tenantId: TEST_TENANT_ID,
        dataCriacao: serverTimestamp(),
        prazoEntrega: pedido.prazoEntrega ? Timestamp.fromDate(pedido.prazoEntrega) : null,
        dataAprovacao: pedido.dataAprovacao ? Timestamp.fromDate(pedido.dataAprovacao) : null
      });
    }
    console.log('✓ Pedidos criados');

    // 12. Criar Vendas
    const vendas = [
      {
        id: 'venda-001', numero: 1001, clienteId: 'cli-001',
        itens: [{ produtoId: 'prod-001', quantidade: 1, precoUnitario: 3500, desconto: 0, total: 3500 }],
        subtotal: 3500, desconto: 0, total: 3500,
        formaPagamento: 'cartao_credito', status: 'concluida',
        dataVenda: new Date('2024-12-01')
      },
      {
        id: 'venda-002', numero: 1002, clienteId: 'cli-003',
        itens: [
          { produtoId: 'prod-002', quantidade: 2, precoUnitario: 4200, desconto: 200, total: 8200 },
          { produtoId: 'prod-005', quantidade: 2, precoUnitario: 2400, desconto: 0, total: 4800 }
        ],
        subtotal: 13200, desconto: 200, total: 13000,
        formaPagamento: 'boleto', status: 'concluida',
        dataVenda: new Date('2024-12-03')
      },
      {
        id: 'venda-003', numero: 1003,
        itens: [
          { produtoId: 'prod-003', quantidade: 3, precoUnitario: 520, desconto: 0, total: 1560 },
          { produtoId: 'prod-004', quantidade: 1, precoUnitario: 280, desconto: 0, total: 280 }
        ],
        subtotal: 1840, desconto: 40, total: 1800,
        formaPagamento: 'pix', status: 'concluida',
        dataVenda: new Date('2024-12-05')
      }
    ];

    for (const venda of vendas) {
      const vendaRef = doc(db, 'tenants', TEST_TENANT_ID, 'vendas', venda.id);
      await setDoc(vendaRef, {
        ...venda,
        tenantId: TEST_TENANT_ID,
        dataVenda: Timestamp.fromDate(venda.dataVenda)
      });
    }
    console.log('✓ Vendas criadas');

    // 13. Criar Ordens de Serviço
    const ordensServico = [
      {
        id: 'os-001', numero: 101, clienteId: 'cli-001',
        cliente: { id: 'cli-001', nome: 'João Silva', cpfCnpj: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 98765-4321', endereco: { logradouro: 'Rua A', numero: '100', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' }, observacoes: '', ativo: true, tenantId: TEST_TENANT_ID },
        descricao: 'Manutenção de computador',
        servicos: [{ descricao: 'Formatação e instalação', quantidade: 1, valorUnitario: 150, total: 150 }],
        valorServicos: 150, valorProdutos: 0, valorTotal: 150,
        status: 'concluida', ativo: true,
        dataAbertura: new Date('2024-12-01'), dataConclusao: new Date('2024-12-02'),
        tecnico: 'Carlos Técnico'
      },
      {
        id: 'os-002', numero: 102, clienteId: 'cli-002',
        cliente: { id: 'cli-002', nome: 'Maria Santos', cpfCnpj: '987.654.321-00', email: 'maria@email.com', telefone: '(11) 91234-5678', endereco: { logradouro: 'Av. B', numero: '200', complemento: 'Apto 10', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '02000-000' }, observacoes: '', ativo: true, tenantId: TEST_TENANT_ID },
        descricao: 'Instalação de rede',
        servicos: [
          { descricao: 'Cabeamento estruturado', quantidade: 1, valorUnitario: 500, total: 500 },
          { descricao: 'Configuração de roteadores', quantidade: 2, valorUnitario: 100, total: 200 }
        ],
        valorServicos: 700, valorProdutos: 0, valorTotal: 700,
        status: 'em_andamento', ativo: true,
        dataAbertura: new Date('2024-12-05'), dataPrevisao: new Date('2024-12-10'),
        tecnico: 'Carlos Técnico', observacoes: 'Aguardando material'
      }
    ];

    for (const os of ordensServico) {
      const osRef = doc(db, 'tenants', TEST_TENANT_ID, 'ordensServico', os.id);
      await setDoc(osRef, {
        ...os,
        tenantId: TEST_TENANT_ID,
        dataAbertura: Timestamp.fromDate(os.dataAbertura),
        dataConclusao: os.dataConclusao ? Timestamp.fromDate(os.dataConclusao) : null,
        dataPrevisao: os.dataPrevisao ? Timestamp.fromDate(os.dataPrevisao) : null
      });
    }
    console.log('✓ Ordens de Serviço criadas');

    // 14. Criar Notas Fiscais de exemplo
    const notasFiscais = [
      {
        id: 'nf-001', numero: '1000', serie: '1', chave: '35241212345678000190550010000010001123456789',
        tipo: 'saida' as const, modelo: 'NF-e',
        emitente: { nome: 'Empresa Teste LTDA', cnpj: '11.222.333/0001-44', ie: '123.456.789.123', endereco: { logradouro: 'Rua de Teste', numero: '123', complemento: 'Sala 1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' } },
        destinatario: { nome: 'Empresa ABC Ltda', cnpj: '11.222.333/0001-44', ie: '123.456.789.123', endereco: { logradouro: 'Rua C', numero: '300', complemento: '', bairro: 'Industrial', cidade: 'Campinas', estado: 'SP', cep: '13000-000' } },
        valorTotal: 13000, valorProdutos: 13000, valorICMS: 2340, valorPIS: 84.5, valorCOFINS: 390,
        dataEmissao: new Date('2024-12-03'), xmlUrl: '', status: 'autorizada',
        produtos: []
      }
    ];

    for (const nota of notasFiscais) {
      const notaRef = doc(db, 'tenants', TEST_TENANT_ID, 'notasFiscais', nota.id);
      await setDoc(notaRef, {
        ...nota,
        tenantId: TEST_TENANT_ID,
        dataEmissao: Timestamp.fromDate(nota.dataEmissao)
      });
    }
    console.log('✓ Notas Fiscais criadas');

    console.log('🎉 Dados do usuário de teste inicializados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao inicializar dados:', error);
    throw error;
  }
}
