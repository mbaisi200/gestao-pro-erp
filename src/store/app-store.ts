import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tenant, Produto, ContaPagar, ContaReceber, Venda, OrdemServico, NotaFiscal, Cliente, Pedido, ConfigBanco, ConfigImpressora, ParametrosTenant, Funcionario, PermissoesAcesso, Fornecedor, UnidadeMedida } from '@/types';
import { Categoria, DashboardMetrics, PlanoAssinatura, User } from '@/types';
import { mockDashboardMetrics, mockTenantsAdmin, mockPlanos } from '@/data/mock';
import { 
  getTenant, createTenant, 
  getProdutos, createProduto, updateProduto, deleteProduto,
  getCategorias, createCategoria,
  getContasPagar, createContaPagar, updateContaPagar,
  getContasReceber, createContaReceber, updateContaReceber,
  getVendas, createVenda,
  getPedidos, createPedido, updatePedido,
  getClientes, createCliente, updateCliente, deleteCliente,
  getNotasFiscais,
  getOrdensServico,
  getAllTenants, updateTenantStatus,
  subscribeFuncionarios,
  subscribeProdutos,
  subscribeCategorias,
  subscribeVendas,
  subscribeClientes,
  getFornecedores as getFornecedoresFS, createFornecedor as createFornecedorFS, updateFornecedor as updateFornecedorFS, deleteFornecedor as deleteFornecedorFS, subscribeFornecedores, getFornecedorByCNPJ,
  getUnidadesMedida as getUnidadesMedidaFS, createUnidadeMedida as createUnidadeMedidaFS, updateUnidadeMedida as updateUnidadeMedidaFS, deleteUnidadeMedida as deleteUnidadeMedidaFS, subscribeUnidadesMedida
} from '@/lib/firestore-service';
import { Unsubscribe } from 'firebase/firestore';

export type Module = 'dashboard' | 'produtos' | 'estoque' | 'financeiro' | 'faturamento' | 'pdv' | 'pedidos' | 'operacional' | 'parametros' | 'admin' | 'funcionarios' | 'categorias' | 'fornecedores' | 'unidades' | 'vendas' | 'nfe';

interface CarrinhoItem {
  produto: Produto;
  quantidade: number;
}

interface AppState {
  // Navigation
  currentModule: Module;
  setModule: (module: Module) => void;
  
  // Auth & User (sincronizado com auth-store)
  isLoading: boolean;
  isAdmin: boolean;
  currentTenant: Tenant | null;
  currentUser: User | null;
  
  // Data Loading
  loadUserData: (user: User, tenant: Tenant) => Promise<void>;
  
  // Dashboard
  dashboardMetrics: DashboardMetrics;
  
  // Produtos e Serviços (nova seção unificada)
  produtos: Produto[];
  categorias: Categoria[];
  loadProdutos: () => Promise<void>;
  loadCategorias: () => Promise<void>;
  addProduto: (produto: Produto) => Promise<void>;
  updateProduto: (id: string, produto: Partial<Produto>) => Promise<void>;
  deleteProduto: (id: string) => Promise<void>;
  addCategoria: (categoria: Categoria) => Promise<void>;
  updateCategoria: (id: string, categoria: Partial<Categoria>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  
  // Estoque (movimentações separadas)
  movimentarEstoque: (produtoId: string, tipo: 'entrada' | 'saida' | 'ajuste', quantidade: number, motivo: string) => void;
  
  // Financeiro
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  loadContasPagar: () => Promise<void>;
  loadContasReceber: () => Promise<void>;
  addContaPagar: (conta: ContaPagar) => Promise<void>;
  addContaReceber: (conta: ContaReceber) => Promise<void>;
  pagarConta: (id: string, dataPagamento: Date, formaPagamento?: string) => Promise<void>;
  receberConta: (id: string, dataRecebimento: Date, formaRecebimento?: string) => Promise<void>;
  
  // Vendas & PDV
  vendas: Venda[];
  carrinho: CarrinhoItem[];
  loadVendas: () => Promise<void>;
  addToCarrinho: (produto: Produto, quantidade: number) => void;
  removeFromCarrinho: (produtoId: string) => void;
  updateCarrinhoItem: (produtoId: string, quantidade: number) => void;
  clearCarrinho: () => void;
  finalizarVenda: (formaPagamento: string, clienteId?: string, observacoes?: string) => Promise<void>;
  
  // Pedidos
  pedidos: Pedido[];
  loadPedidos: () => Promise<void>;
  addPedido: (pedido: Pedido) => Promise<void>;
  aprovarPedido: (id: string) => Promise<void>;
  cancelarPedido: (id: string) => Promise<void>;
  converterPedidoEmVenda: (pedidoId: string, formaPagamento: string) => Promise<void>;
  
  // Operacional
  ordensServico: OrdemServico[];
  notasFiscais: NotaFiscal[];
  clientes: Cliente[];
  loadOrdensServico: () => Promise<void>;
  loadNotasFiscais: () => Promise<void>;
  loadClientes: () => Promise<void>;
  addOrdemServico: (os: OrdemServico) => Promise<void>;
  updateOrdemServico: (id: string, os: Partial<OrdemServico>) => Promise<void>;
  deleteOrdemServico: (id: string) => Promise<void>;
  converterOSEmPedido: (osId: string) => Promise<void>;
  converterOSEmVenda: (osId: string, parcelas: { numero: number; valor: number; vencimento: Date }[]) => Promise<void>;
  toggleOSAtivo: (id: string) => void;
  
  // Parâmetros
  parametrosTenant: ParametrosTenant | null;
  bancos: ConfigBanco[];
  impressoras: ConfigImpressora[];
  loadParametros: () => Promise<void>;
  loadBancos: () => Promise<void>;
  loadImpressoras: () => Promise<void>;
  addBanco: (banco: ConfigBanco) => void;
  updateBanco: (id: string, banco: Partial<ConfigBanco>) => void;
  deleteBanco: (id: string) => void;
  addImpressora: (impressora: ConfigImpressora) => void;
  updateImpressora: (id: string, impressora: Partial<ConfigImpressora>) => void;
  deleteImpressora: (id: string) => void;

  // Faturamento - Importar XML
  importarXML: (xmlContent: string, tenantId?: string) => Promise<NotaFiscal | null>;
  addNotaFiscal: (nota: NotaFiscal, tenantId?: string) => Promise<string>;
  deleteNotaFiscal: (id: string, tenantId?: string) => Promise<void>;

  // Admin
  tenants: Tenant[];
  planos: PlanoAssinatura[];
  loadTenants: () => Promise<void>;
  addTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  updateTenantStatus: (id: string, status: Tenant['status']) => Promise<void>;
  
  // Funcionários
  funcionarios: Funcionario[];
  loadFuncionarios: () => Promise<void>;
  addFuncionario: (funcionario: Funcionario) => Promise<void>;
  updateFuncionario: (id: string, funcionario: Partial<Funcionario>) => Promise<void>;
  deleteFuncionario: (id: string) => Promise<void>;
  toggleFuncionarioAtivo: (id: string) => void;
  autenticarFuncionario: (email: string, senha: string) => Promise<Funcionario | null>;
  
  // Real-time subscriptions
  subscriptions: Unsubscribe[];
  subscribeToData: () => void;
  unsubscribeAll: () => void;
  setFuncionarios: (funcionarios: Funcionario[]) => void;
  setProdutos: (produtos: Produto[]) => void;
  setCategorias: (categorias: Categoria[]) => void;
  setVendas: (vendas: Venda[]) => void;
  setClientes: (clientes: Cliente[]) => void;
  
  // Clientes
  addCliente: (cliente: Cliente) => Promise<void>;
  updateClienteStore: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  deleteClienteStore: (id: string) => Promise<void>;
  
  // Fornecedores
  fornecedores: Fornecedor[];
  loadFornecedores: () => Promise<void>;
  addFornecedor: (fornecedor: Fornecedor) => Promise<string>;
  updateFornecedor: (id: string, fornecedor: Partial<Fornecedor>) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  setFornecedores: (fornecedores: Fornecedor[]) => void;
  
  // Unidades de Medida
  unidadesMedida: UnidadeMedida[];
  loadUnidadesMedida: () => Promise<void>;
  addUnidadeMedida: (unidade: UnidadeMedida) => Promise<void>;
  updateUnidadeMedida: (id: string, unidade: Partial<UnidadeMedida>) => Promise<void>;
  deleteUnidadeMedida: (id: string) => Promise<void>;
  setUnidadesMedida: (unidades: UnidadeMedida[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Navigation
  currentModule: 'dashboard',
  setModule: (module) => set({ currentModule: module }),
  
  // Auth & User
  isLoading: false,
  isAdmin: false,
  currentTenant: null,
  currentUser: null,
  
  // Data Loading
  loadUserData: async (user: User, tenant: Tenant) => {
    console.log('=== LOAD USER DATA ===');
    console.log('User:', user);
    console.log('Tenant:', tenant);
    console.log('Tenant ID:', tenant?.id);
    
    const isAdminMaster = user.role === 'admin' && user.tenantId === 'admin-master';
    set({ isLoading: true, currentUser: user, currentTenant: tenant, isAdmin: isAdminMaster });
    
    console.log('currentTenant definido:', get().currentTenant?.id);
    
    try {
      if (isAdminMaster) {
        const tenants = await getAllTenants();
        set({ tenants, isLoading: false });
      } else {
        await Promise.all([
          get().loadProdutos(),
          get().loadCategorias(),
          get().loadContasPagar(),
          get().loadContasReceber(),
          get().loadVendas(),
          get().loadPedidos(),
          get().loadClientes(),
          get().loadOrdensServico(),
          get().loadNotasFiscais(),
          get().loadParametros(),
          get().loadBancos(),
          get().loadImpressoras(),
          get().loadFuncionarios(),
          get().loadFornecedores()
        ]);
        
        console.log('=== DADOS CARREGADOS ===');
        console.log('Produtos:', get().produtos.length);
        console.log('Notas Fiscais:', get().notasFiscais.length);
        console.log('Clientes:', get().clientes.length);
        console.log('Fornecedores:', get().fornecedores.length);
        
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, definir listas vazias
      set({
        produtos: [],
        categorias: [],
        contasPagar: [],
        contasReceber: [],
        vendas: [],
        pedidos: [],
        clientes: [],
        ordensServico: [],
        notasFiscais: [],
        fornecedores: [],
        funcionarios: [],
        bancos: [],
        impressoras: [],
        parametrosTenant: null,
        isLoading: false
      });
    }
  },
  
  // Dashboard
  dashboardMetrics: mockDashboardMetrics,
  
  // Produtos e Serviços
  produtos: [],
  categorias: [],
  
  loadProdutos: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD PRODUTOS ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ produtos: [] });
      return;
    }
    try {
      console.log('Buscando produtos para tenant:', currentTenant.id);
      const produtos = await getProdutos(currentTenant.id);
      console.log('Produtos encontrados:', produtos.length);
      set({ produtos: produtos });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      set({ produtos: [] });
    }
  },
  
  loadCategorias: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD CATEGORIAS ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ categorias: [] });
      return;
    }
    try {
      console.log('Buscando categorias para tenant:', currentTenant.id);
      const categorias = await getCategorias(currentTenant.id);
      console.log('Categorias encontradas:', categorias.length);
      set({ categorias: categorias });
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      set({ categorias: [] });
    }
  },
  
  addProduto: async (produto: Produto) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createProduto(currentTenant.id, produto);
      set((state) => ({ produtos: [...state.produtos, produto] }));
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      set((state) => ({ produtos: [...state.produtos, produto] }));
    }
  },
  
  updateProduto: async (id: string, data: Partial<Produto>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateProduto(currentTenant.id, id, data);
      set((state) => ({
        produtos: state.produtos.map(p => p.id === id ? { ...p, ...data } : p)
      }));
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  },
  
  deleteProduto: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { deleteProduto: deleteProdutoFS } = await import('@/lib/firestore-service');
      await deleteProdutoFS(currentTenant.id, id);
      set((state) => ({
        produtos: state.produtos.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  },
  
  addCategoria: async (categoria: Categoria) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createCategoria(currentTenant.id, categoria);
      set((state) => ({ categorias: [...state.categorias, categoria] }));
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      set((state) => ({ categorias: [...state.categorias, categoria] }));
    }
  },
  
  updateCategoria: async (id: string, data: Partial<Categoria>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { updateCategoria: updateCategoriaFS } = await import('@/lib/firestore-service');
      await updateCategoriaFS(currentTenant.id, id, data);
      set((state) => ({
        categorias: state.categorias.map(c => c.id === id ? { ...c, ...data } : c)
      }));
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      set((state) => ({
        categorias: state.categorias.map(c => c.id === id ? { ...c, ...data } : c)
      }));
    }
  },
  
  deleteCategoria: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { deleteCategoria: deleteCategoriaFS } = await import('@/lib/firestore-service');
      await deleteCategoriaFS(currentTenant.id, id);
      set((state) => ({
        categorias: state.categorias.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      set((state) => ({
        categorias: state.categorias.filter(c => c.id !== id)
      }));
    }
  },
  
  // Estoque
  movimentarEstoque: (produtoId: string, tipo: 'entrada' | 'saida' | 'ajuste', quantidade: number, motivo: string) => {
    set((state) => ({
      produtos: state.produtos.map(p => {
        if (p.id === produtoId) {
          let novoEstoque = p.estoqueAtual;
          if (tipo === 'entrada') novoEstoque += quantidade;
          else if (tipo === 'saida') novoEstoque -= quantidade;
          else novoEstoque = quantidade; // ajuste
          return { ...p, estoqueAtual: Math.max(0, novoEstoque) };
        }
        return p;
      })
    }));
  },
  
  // Financeiro
  contasPagar: [],
  contasReceber: [],
  
  loadContasPagar: async () => {
    const { currentTenant } = get();
    if (!currentTenant) {
      set({ contasPagar: [] });
      return;
    }
    try {
      const contas = await getContasPagar(currentTenant.id);
      set({ contasPagar: contas });
    } catch {
      set({ contasPagar: [] });
    }
  },
  
  loadContasReceber: async () => {
    const { currentTenant } = get();
    if (!currentTenant) {
      set({ contasReceber: [] });
      return;
    }
    try {
      const contas = await getContasReceber(currentTenant.id);
      set({ contasReceber: contas });
    } catch {
      set({ contasReceber: [] });
    }
  },
  
  addContaPagar: async (conta: ContaPagar) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createContaPagar(currentTenant.id, conta);
      set((state) => ({ contasPagar: [...state.contasPagar, conta] }));
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
    }
  },
  
  addContaReceber: async (conta: ContaReceber) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createContaReceber(currentTenant.id, conta);
      set((state) => ({ contasReceber: [...state.contasReceber, conta] }));
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
    }
  },
  
  pagarConta: async (id: string, dataPagamento: Date, formaPagamento?: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateContaPagar(currentTenant.id, id, { 
        status: 'pago', 
        dataPagamento,
        dataBaixa: new Date(),
        formaPagamento: formaPagamento as ContaPagar['formaPagamento']
      });
      set((state) => ({
        contasPagar: state.contasPagar.map(c => 
          c.id === id ? { ...c, status: 'pago' as const, dataPagamento, dataBaixa: new Date(), formaPagamento: formaPagamento as ContaPagar['formaPagamento'] } : c
        )
      }));
    } catch (error) {
      console.error('Erro ao pagar conta:', error);
    }
  },
  
  receberConta: async (id: string, dataRecebimento: Date, formaRecebimento?: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateContaReceber(currentTenant.id, id, { 
        status: 'recebido', 
        dataRecebimento,
        dataBaixa: new Date(),
        formaRecebimento: formaRecebimento as ContaReceber['formaRecebimento']
      });
      set((state) => ({
        contasReceber: state.contasReceber.map(c => 
          c.id === id ? { ...c, status: 'recebido' as const, dataRecebimento, dataBaixa: new Date(), formaRecebimento: formaRecebimento as ContaReceber['formaRecebimento'] } : c
        )
      }));
    } catch (error) {
      console.error('Erro ao receber conta:', error);
    }
  },
  
  // Vendas & PDV
  vendas: [],
  carrinho: [],
  
  loadVendas: async () => {
    const { currentTenant } = get();
    if (!currentTenant) {
      set({ vendas: [] });
      return;
    }
    try {
      const vendas = await getVendas(currentTenant.id);
      set({ vendas: vendas });
    } catch {
      set({ vendas: [] });
    }
  },
  
  addToCarrinho: (produto: Produto, quantidade: number) => set((state) => {
    const existing = state.carrinho.find(item => item.produto.id === produto.id);
    if (existing) {
      return {
        carrinho: state.carrinho.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        )
      };
    }
    return { carrinho: [...state.carrinho, { produto, quantidade }] };
  }),
  
  removeFromCarrinho: (produtoId: string) => set((state) => ({
    carrinho: state.carrinho.filter(item => item.produto.id !== produtoId)
  })),
  
  updateCarrinhoItem: (produtoId: string, quantidade: number) => set((state) => ({
    carrinho: state.carrinho.map(item =>
      item.produto.id === produtoId ? { ...item, quantidade } : item
    )
  })),
  
  clearCarrinho: () => set({ carrinho: [] }),
  
  finalizarVenda: async (formaPagamento: string, clienteId?: string, observacoes?: string) => {
    const { currentTenant, carrinho } = get();
    if (!currentTenant || carrinho.length === 0) return;
    
    const total = carrinho.reduce((acc, item) => acc + (item.produto.precoVenda * item.quantidade), 0);
    
    const novaVenda: Venda = {
      id: `venda-${Date.now()}`,
      tenantId: currentTenant.id,
      numero: get().vendas.length + 1002,
      clienteId,
      itens: carrinho.map(item => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
        precoUnitario: item.produto.precoVenda,
        desconto: 0,
        total: item.produto.precoVenda * item.quantidade
      })),
      subtotal: total,
      desconto: 0,
      total,
      formaPagamento: formaPagamento as Venda['formaPagamento'],
      status: 'concluida',
      dataVenda: new Date(),
      observacoes: observacoes || ''
    };
    
    try {
      const vendaId = await createVenda(currentTenant.id, novaVenda);
      
      // Atualizar estoque
      carrinho.forEach(item => {
        get().movimentarEstoque(item.produto.id, 'saida', item.quantidade, `Venda ${vendaId}`);
      });
      
      set((state) => ({ 
        vendas: [...state.vendas, { ...novaVenda, id: vendaId }],
        carrinho: []
      }));
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      set((state) => ({ 
        vendas: [...state.vendas, novaVenda],
        carrinho: []
      }));
    }
  },
  
  // Pedidos
  pedidos: [],
  
  loadPedidos: async () => {
    const { currentTenant } = get();
    if (!currentTenant) {
      set({ pedidos: [] });
      return;
    }
    try {
      const pedidos = await getPedidos(currentTenant.id);
      set({ pedidos: pedidos });
    } catch {
      set({ pedidos: [] });
    }
  },
  
  addPedido: async (pedido: Pedido) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createPedido(currentTenant.id, pedido);
      set((state) => ({ pedidos: [...state.pedidos, pedido] }));
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    }
  },
  
  aprovarPedido: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updatePedido(currentTenant.id, id, { status: 'aprovado', dataAprovacao: new Date() });
      set((state) => ({
        pedidos: state.pedidos.map(p => 
          p.id === id ? { ...p, status: 'aprovado' as const, dataAprovacao: new Date() } : p
        )
      }));
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
    }
  },
  
  cancelarPedido: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updatePedido(currentTenant.id, id, { status: 'cancelado' });
      set((state) => ({
        pedidos: state.pedidos.map(p => 
          p.id === id ? { ...p, status: 'cancelado' as const } : p
        )
      }));
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    }
  },
  
  converterPedidoEmVenda: async (pedidoId: string, formaPagamento: string) => {
    const { currentTenant, pedidos } = get();
    if (!currentTenant) return;
    
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    if (pedido.status !== 'aprovado') {
      console.error('Pedido deve estar aprovado para ser convertido em venda');
      return;
    }
    
    const novaVenda: Venda = {
      id: `venda-${Date.now()}`,
      tenantId: currentTenant.id,
      numero: get().vendas.length + 1002,
      clienteId: pedido.clienteId,
      pedidoId: pedido.id,
      itens: pedido.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        desconto: item.desconto,
        total: item.total
      })),
      subtotal: pedido.subtotal,
      desconto: pedido.desconto,
      total: pedido.total,
      formaPagamento: formaPagamento as Venda['formaPagamento'],
      status: 'concluida',
      dataVenda: new Date(),
      observacoes: pedido.observacoes
    };
    
    try {
      const vendaId = await createVenda(currentTenant.id, novaVenda);
      await updatePedido(currentTenant.id, pedidoId, { 
        status: 'convertido', 
        vendaId 
      });
      
      // Atualizar estoque
      pedido.itens.forEach(item => {
        get().movimentarEstoque(item.produtoId, 'saida', item.quantidade, `Venda ${vendaId} - Pedido ${pedido.numero}`);
      });
      
      set((state) => ({ 
        vendas: [...state.vendas, { ...novaVenda, id: vendaId }],
        pedidos: state.pedidos.map(p => 
          p.id === pedidoId ? { ...p, status: 'convertido' as const, vendaId } : p
        )
      }));
    } catch (error) {
      console.error('Erro ao converter pedido:', error);
    }
  },
  
  // Operacional
  ordensServico: [],
  notasFiscais: [],
  clientes: [],
  
  loadOrdensServico: async () => {
    const { currentTenant } = get();
    if (!currentTenant) {
      set({ ordensServico: [] });
      return;
    }
    try {
      const ordens = await getOrdensServico(currentTenant.id);
      set({ ordensServico: ordens });
    } catch {
      set({ ordensServico: [] });
    }
  },
  
  loadNotasFiscais: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD NOTAS FISCAIS ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ notasFiscais: [] });
      return;
    }
    try {
      console.log('Buscando notas fiscais para tenant:', currentTenant.id);
      const notas = await getNotasFiscais(currentTenant.id);
      console.log('Notas encontradas:', notas.length);
      set({ notasFiscais: notas }); // Sempre usa os dados do Firestore, nunca mock
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      set({ notasFiscais: [] }); // Lista vazia em caso de erro
    }
  },
  
  loadClientes: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD CLIENTES ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ clientes: [] });
      return;
    }
    try {
      console.log('Buscando clientes para tenant:', currentTenant.id);
      const clientes = await getClientes(currentTenant.id);
      console.log('Clientes encontrados:', clientes.length);
      set({ clientes: clientes });
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      set({ clientes: [] });
    }
  },
  
  addOrdemServico: async (os: OrdemServico) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      set((state) => ({ ordensServico: [...state.ordensServico, os] }));
    } catch (error) {
      console.error('Erro ao criar OS:', error);
    }
  },
  
  updateOrdemServico: async (id: string, data: Partial<OrdemServico>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      set((state) => ({
        ordensServico: state.ordensServico.map(os => 
          os.id === id ? { ...os, ...data } : os
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar OS:', error);
    }
  },
  
  deleteOrdemServico: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      set((state) => ({
        ordensServico: state.ordensServico.filter(os => os.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar OS:', error);
    }
  },
  
  converterOSEmPedido: async (osId: string) => {
    const { currentTenant, ordensServico } = get();
    if (!currentTenant) return;
    
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const novoPedido: Pedido = {
      id: `pedido-${Date.now()}`,
      tenantId: currentTenant.id,
      numero: get().pedidos.length + 1001,
      clienteId: os.clienteId,
      nomeCliente: os.cliente?.nome,
      itens: os.produtos ? os.produtos.map(p => ({
        produtoId: p.produtoId,
        produto: p.produto,
        quantidade: p.quantidade,
        precoUnitario: p.precoUnitario,
        desconto: p.desconto,
        total: p.total
      })) : [],
      subtotal: os.valorTotal,
      desconto: 0,
      total: os.valorTotal,
      status: 'pendente',
      condicaoPagamento: 'A combinar',
      observacoes: `Convertida de OS #${os.numero} - ${os.descricao}`,
      dataCriacao: new Date(),
      criadoPor: get().currentUser?.id || 'sistema'
    };
    
    try {
      await createPedido(currentTenant.id, novoPedido);
      
      // Marcar OS como aprovada
      set((state) => ({
        pedidos: [...state.pedidos, novoPedido],
        ordensServico: state.ordensServico.map(o => 
          o.id === osId ? { 
            ...o, 
            status: 'aprovada' as const,
            dataAprovacao: new Date()
          } : o
        )
      }));
    } catch (error) {
      console.error('Erro ao converter OS em Pedido:', error);
    }
  },
  
  converterOSEmVenda: async (osId: string, parcelas: { numero: number; valor: number; vencimento: Date }[]) => {
    const { currentTenant, ordensServico } = get();
    if (!currentTenant) return;
    
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const novaVenda: Venda = {
      id: `venda-${Date.now()}`,
      tenantId: currentTenant.id,
      numero: get().vendas.length + 1002,
      clienteId: os.clienteId,
      ordemServicoId: os.id,
      itens: os.produtos || [],
      subtotal: os.valorTotal,
      desconto: 0,
      total: os.valorTotal,
      formaPagamento: 'boleto',
      status: 'concluida',
      dataVenda: new Date(),
      observacoes: `Origem: OS #${os.numero} - ${os.descricao}`
    };
    
    try {
      const vendaId = await createVenda(currentTenant.id, novaVenda);
      
      // Criar contas a receber baseadas nas parcelas
      for (const parcela of parcelas) {
        const conta: ContaReceber = {
          id: `cr-${Date.now()}-${parcela.numero}`,
          tenantId: currentTenant.id,
          descricao: `OS #${os.numero} - Parcela ${parcela.numero}/${parcelas.length}`,
          valor: parcela.valor,
          vencimento: parcela.vencimento,
          status: 'pendente',
          categoria: 'Serviços',
          clienteId: os.clienteId
        };
        get().addContaReceber(conta);
      }
      
      // Marcar OS como convertida e inativa
      set((state) => ({
        vendas: [...state.vendas, { ...novaVenda, id: vendaId }],
        ordensServico: state.ordensServico.map(o => 
          o.id === osId ? { 
            ...o, 
            status: 'convertida' as const, 
            ativo: false,
            vendaId,
            dataConversao: new Date()
          } : o
        )
      }));
    } catch (error) {
      console.error('Erro ao converter OS:', error);
    }
  },
  
  toggleOSAtivo: (id: string) => {
    set((state) => ({
      ordensServico: state.ordensServico.map(os => 
        os.id === id ? { ...os, ativo: !os.ativo } : os
      )
    }));
  },
  
  // Parâmetros
  parametrosTenant: null,
  bancos: [],
  impressoras: [],
  
  loadParametros: async () => {
    // TODO: Implementar busca no Firestore
    set({ parametrosTenant: null });
  },
  
  loadBancos: async () => {
    // TODO: Implementar busca no Firestore
    set({ bancos: [] });
  },
  
  loadImpressoras: async () => {
    // TODO: Implementar busca no Firestore
    set({ impressoras: [] });
  },
  
  addBanco: (banco: ConfigBanco) => {
    set((state) => ({ bancos: [...state.bancos, banco] }));
  },
  
  updateBanco: (id: string, data: Partial<ConfigBanco>) => {
    set((state) => ({
      bancos: state.bancos.map(b => b.id === id ? { ...b, ...data } : b)
    }));
  },
  
  deleteBanco: (id: string) => {
    set((state) => ({
      bancos: state.bancos.filter(b => b.id !== id)
    }));
  },
  
  addImpressora: (impressora: ConfigImpressora) => {
    set((state) => ({ impressoras: [...state.impressoras, impressora] }));
  },
  
  updateImpressora: (id: string, data: Partial<ConfigImpressora>) => {
    set((state) => ({
      impressoras: state.impressoras.map(i => i.id === id ? { ...i, ...data } : i)
    }));
  },
  
  deleteImpressora: (id: string) => {
    set((state) => ({
      impressoras: state.impressoras.filter(i => i.id !== id)
    }));
  },
  
  // Faturamento - Importar XML
  importarXML: async (xmlContent: string): Promise<NotaFiscal | null> => {
    try {
      // Parser básico de XML para NF-e
      // Em produção, usar biblioteca específica como xml2js
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Extrair dados básicos do XML
      const nfe = xmlDoc.getElementsByTagName('NFe')[0];
      if (!nfe) throw new Error('XML inválido');
      
      const ide = nfe.getElementsByTagName('ide')[0];
      const emit = nfe.getElementsByTagName('emit')[0];
      const dest = nfe.getElementsByTagName('dest')[0];
      const total = nfe.getElementsByTagName('total')[0];
      
      const nota: NotaFiscal = {
        id: `nf-import-${Date.now()}`,
        tenantId: get().currentTenant?.id || '',
        numero: ide?.getElementsByTagName('nNF')[0]?.textContent || '',
        serie: ide?.getElementsByTagName('serie')[0]?.textContent || '',
        chave: '', // Extrair da assinatura
        tipo: 'entrada',
        modelo: 'NF-e',
        emitente: {
          nome: emit?.getElementsByTagName('xNome')[0]?.textContent || '',
          cnpj: emit?.getElementsByTagName('CNPJ')[0]?.textContent || '',
          ie: emit?.getElementsByTagName('IE')[0]?.textContent || '',
          endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          }
        },
        destinatario: {
          nome: dest?.getElementsByTagName('xNome')[0]?.textContent || '',
          cnpj: dest?.getElementsByTagName('CNPJ')[0]?.textContent || '',
          ie: dest?.getElementsByTagName('IE')[0]?.textContent || '',
          endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          }
        },
        valorTotal: parseFloat(total?.getElementsByTagName('vNF')[0]?.textContent || '0'),
        valorProdutos: parseFloat(total?.getElementsByTagName('vProd')[0]?.textContent || '0'),
        valorICMS: parseFloat(total?.getElementsByTagName('vICMS')[0]?.textContent || '0'),
        valorPIS: parseFloat(total?.getElementsByTagName('vPIS')[0]?.textContent || '0'),
        valorCOFINS: parseFloat(total?.getElementsByTagName('vCOFINS')[0]?.textContent || '0'),
        dataEmissao: new Date(ide?.getElementsByTagName('dhEmi')[0]?.textContent || new Date()),
        xmlUrl: '',
        xmlConteudo: xmlContent,
        status: 'autorizada',
        produtos: []
      };

      set((state) => ({
        notasFiscais: [...state.notasFiscais, nota]
      }));

      return nota;
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      return null;
    }
  },

  addNotaFiscal: async (nota: NotaFiscal, explicitTenantId?: string): Promise<string> => {
    try {
      // Usar tenantId explícito ou do estado atual
      const tenantId = explicitTenantId || get().currentTenant?.id || nota.tenantId;
      if (!tenantId) {
        throw new Error('Tenant não encontrado. Por favor, faça login novamente.');
      }

      const { createNotaFiscal: createNotaFiscalFS } = await import('@/lib/firestore-service');
      const notaId = await createNotaFiscalFS(tenantId, { ...nota, tenantId });

      // Adicionar ao estado local
      set((state) => ({
        notasFiscais: [...state.notasFiscais, { ...nota, id: notaId, tenantId }]
      }));

      console.log('Nota fiscal salva com ID:', notaId);
      return notaId;
    } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      throw error;
    }
  },

  deleteNotaFiscal: async (id: string, explicitTenantId?: string) => {
    try {
      const tenantId = explicitTenantId || get().currentTenant?.id;
      if (!tenantId) {
        throw new Error('Tenant não encontrado. Por favor, faça login novamente.');
      }

      const { deleteNotaFiscal: deleteNotaFiscalFS } = await import('@/lib/firestore-service');
      await deleteNotaFiscalFS(tenantId, id);

      set((state) => ({
        notasFiscais: state.notasFiscais.filter(n => n.id !== id)
      }));

      console.log('Nota fiscal excluída:', id);
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      throw error;
    }
  },

  // Admin
  tenants: [],
  planos: mockPlanos,
  
  loadTenants: async () => {
    try {
      const tenants = await getAllTenants();
      set({ tenants });
    } catch {
      set({ tenants: [] });
    }
  },

  addTenant: (tenant: Tenant) => {
    set((state) => ({
      tenants: [...state.tenants, tenant]
    }));
  },

  setTenants: (tenants: Tenant[]) => {
    set({ tenants });
  },

  updateTenantStatus: async (id: string, status: Tenant['status']) => {
    try {
      await updateTenantStatus(id, status);
      set((state) => ({
        tenants: state.tenants.map(t => t.id === id ? { ...t, status } : t)
      }));
    } catch (error) {
      console.error('Erro ao atualizar status do tenant:', error);
    }
  },
  
  // Funcionários
  funcionarios: [],
  
  loadFuncionarios: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD FUNCIONARIOS ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ funcionarios: [] });
      return;
    }
    try {
      console.log('Buscando funcionários para tenant:', currentTenant.id);
      const { getFuncionarios } = await import('@/lib/firestore-service');
      const funcionarios = await getFuncionarios(currentTenant.id);
      console.log('Funcionários encontrados:', funcionarios?.length || 0);
      set({ funcionarios: funcionarios || [] });
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      set({ funcionarios: [] });
    }
  },
  
  addFuncionario: async (funcionario: Funcionario) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { createFuncionario } = await import('@/lib/firestore-service');
      await createFuncionario(currentTenant.id, funcionario);
      set((state) => ({ funcionarios: [...state.funcionarios, funcionario] }));
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      set((state) => ({ funcionarios: [...state.funcionarios, funcionario] }));
    }
  },
  
  updateFuncionario: async (id: string, data: Partial<Funcionario>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { updateFuncionario: updateFuncionarioFS } = await import('@/lib/firestore-service');
      await updateFuncionarioFS(currentTenant.id, id, data);
      set((state) => ({
        funcionarios: state.funcionarios.map(f => f.id === id ? { ...f, ...data } : f)
      }));
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      set((state) => ({
        funcionarios: state.funcionarios.map(f => f.id === id ? { ...f, ...data } : f)
      }));
    }
  },
  
  deleteFuncionario: async (id: string) => {
    set((state) => ({
      funcionarios: state.funcionarios.filter(f => f.id !== id)
    }));
    
    const { currentTenant } = get();
    if (!currentTenant) return;
    
    try {
      const { deleteFuncionario: deleteFuncionarioFS } = await import('@/lib/firestore-service');
      await deleteFuncionarioFS(currentTenant.id, id);
    } catch (error) {
      console.error('Erro ao deletar funcionário no Firestore:', error);
    }
  },
  
  toggleFuncionarioAtivo: (id: string) => {
    set((state) => ({
      funcionarios: state.funcionarios.map(f => 
        f.id === id ? { ...f, ativo: !f.ativo } : f
      )
    }));
  },
  
  autenticarFuncionario: async (email: string, senha: string): Promise<Funcionario | null> => {
    const { funcionarios } = get();
    const funcionario = funcionarios.find(f => 
      f.email.toLowerCase() === email.toLowerCase() && 
      f.senha === senha && 
      f.ativo && 
      f.podeAcessarSistema
    );
    
    if (funcionario) {
      // Atualizar último acesso
      const now = new Date();
      set((state) => ({
        funcionarios: state.funcionarios.map(f => 
          f.id === funcionario.id ? { ...f, ultimoAcesso: now } : f
        )
      }));
      return funcionario;
    }
    
    return null;
  },
  
  // Real-time subscriptions
  subscriptions: [],
  
  subscribeToData: () => {
    const { currentTenant, unsubscribeAll } = get();
    if (!currentTenant) return;
    
    // Primeiro, cancelar subscrições anteriores
    unsubscribeAll();
    
    const newSubscriptions: Unsubscribe[] = [];
    
    // Subscrever para funcionários
    const unsubFuncionarios = subscribeFuncionarios(currentTenant.id, (funcionarios) => {
      set({ funcionarios });
    });
    newSubscriptions.push(unsubFuncionarios);
    
    // Subscrever para produtos
    const unsubProdutos = subscribeProdutos(currentTenant.id, (produtos) => {
      set({ produtos }); // Sempre usa os dados do Firestore, nunca mock
    });
    newSubscriptions.push(unsubProdutos);
    
    // Subscrever para categorias
    const unsubCategorias = subscribeCategorias(currentTenant.id, (categorias) => {
      set({ categorias }); // Sempre usa os dados do Firestore, nunca mock
    });
    newSubscriptions.push(unsubCategorias);
    
    // Subscrever para vendas
    const unsubVendas = subscribeVendas(currentTenant.id, (vendas) => {
      set({ vendas }); // Sempre usa os dados do Firestore, nunca mock
    });
    newSubscriptions.push(unsubVendas);
    
    // Subscrever para clientes
    const unsubClientes = subscribeClientes(currentTenant.id, (clientes) => {
      set({ clientes }); // Sempre usa os dados do Firestore, nunca mock
    });
    newSubscriptions.push(unsubClientes);
    
    set({ subscriptions: newSubscriptions });
  },
  
  unsubscribeAll: () => {
    const { subscriptions } = get();
    subscriptions.forEach(unsub => unsub());
    set({ subscriptions: [] });
  },
  
  setFuncionarios: (funcionarios: Funcionario[]) => set({ funcionarios }),
  setProdutos: (produtos: Produto[]) => set({ produtos }),
  setCategorias: (categorias: Categoria[]) => set({ categorias }),
  setVendas: (vendas: Venda[]) => set({ vendas }),
  setClientes: (clientes: Cliente[]) => set({ clientes }),
  
  // Clientes
  addCliente: async (cliente: Cliente) => {
    const { currentTenant } = get();
    console.log('=== ADD CLIENTE ===');
    console.log('currentTenant:', currentTenant?.id);
    console.log('cliente:', cliente);
    
    if (!currentTenant) {
      console.error('Sem currentTenant, não é possível adicionar cliente');
      return;
    }
    try {
      const clienteId = await createCliente(currentTenant.id, cliente);
      console.log('Cliente salvo no Firestore com ID:', clienteId);
      // Atualizar estado local imediatamente
      set((state) => ({ 
        clientes: [...state.clientes, { ...cliente, id: clienteId || cliente.id }] 
      }));
      console.log('Estado local atualizado');
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },
  
  updateClienteStore: async (id: string, data: Partial<Cliente>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateCliente(currentTenant.id, id, data);
      // Atualizar estado local imediatamente
      set((state) => ({
        clientes: state.clientes.map(c => c.id === id ? { ...c, ...data } : c)
      }));
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },
  
  deleteClienteStore: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await deleteCliente(currentTenant.id, id);
      // Atualizar estado local imediatamente
      set((state) => ({
        clientes: state.clientes.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  },
  
  // Fornecedores
  fornecedores: [],
  
  loadFornecedores: async () => {
    const { currentTenant } = get();
    console.log('=== LOAD FORNECEDORES ===');
    console.log('currentTenant:', currentTenant?.id);
    
    if (!currentTenant) {
      console.log('Sem currentTenant, usando lista vazia');
      set({ fornecedores: [] });
      return;
    }
    try {
      console.log('Buscando fornecedores para tenant:', currentTenant.id);
      const fornecedores = await getFornecedoresFS(currentTenant.id);
      console.log('Fornecedores encontrados:', fornecedores?.length || 0);
      set({ fornecedores: fornecedores || [] });
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      set({ fornecedores: [] });
    }
  },
  
  addFornecedor: async (fornecedor: Fornecedor): Promise<string> => {
    const { currentTenant } = get();
    if (!currentTenant) return '';
    try {
      const id = await createFornecedorFS(currentTenant.id, fornecedor);
      set((state) => ({ fornecedores: [...state.fornecedores, { ...fornecedor, id }] }));
      console.log('Fornecedor salvo com ID:', id);
      return id;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      set((state) => ({ fornecedores: [...state.fornecedores, fornecedor] }));
      return fornecedor.id;
    }
  },
  
  updateFornecedor: async (id: string, data: Partial<Fornecedor>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateFornecedorFS(currentTenant.id, id, data);
      set((state) => ({
        fornecedores: state.fornecedores.map(f => f.id === id ? { ...f, ...data } : f)
      }));
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      set((state) => ({
        fornecedores: state.fornecedores.map(f => f.id === id ? { ...f, ...data } : f)
      }));
    }
  },
  
  deleteFornecedor: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await deleteFornecedorFS(currentTenant.id, id);
      set((state) => ({
        fornecedores: state.fornecedores.filter(f => f.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      set((state) => ({
        fornecedores: state.fornecedores.filter(f => f.id !== id)
      }));
    }
  },
  
  setFornecedores: (fornecedores: Fornecedor[]) => set({ fornecedores }),
  
  // Unidades de Medida
  unidadesMedida: [],
  
  loadUnidadesMedida: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const unidades = await getUnidadesMedidaFS(currentTenant.id);
      set({ unidadesMedida: unidades || [] });
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error);
      set({ unidadesMedida: [] });
    }
  },
  
  addUnidadeMedida: async (unidade: UnidadeMedida) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await createUnidadeMedidaFS(currentTenant.id, unidade);
      set((state) => ({ unidadesMedida: [...state.unidadesMedida, unidade] }));
    } catch (error) {
      console.error('Erro ao criar unidade de medida:', error);
      set((state) => ({ unidadesMedida: [...state.unidadesMedida, unidade] }));
    }
  },
  
  updateUnidadeMedida: async (id: string, data: Partial<UnidadeMedida>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateUnidadeMedidaFS(currentTenant.id, id, data);
      set((state) => ({
        unidadesMedida: state.unidadesMedida.map(u => u.id === id ? { ...u, ...data } : u)
      }));
    } catch (error) {
      console.error('Erro ao atualizar unidade de medida:', error);
      set((state) => ({
        unidadesMedida: state.unidadesMedida.map(u => u.id === id ? { ...u, ...data } : u)
      }));
    }
  },
  
  deleteUnidadeMedida: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await deleteUnidadeMedidaFS(currentTenant.id, id);
      set((state) => ({
        unidadesMedida: state.unidadesMedida.filter(u => u.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar unidade de medida:', error);
      set((state) => ({
        unidadesMedida: state.unidadesMedida.filter(u => u.id !== id)
      }));
    }
  },
  
  setUnidadesMedida: (unidadesMedida: UnidadeMedida[]) => set({ unidadesMedida })
}),
    {
      name: 'gestao-pro-app',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        currentUser: state.currentUser
      })
    }
  )
);
