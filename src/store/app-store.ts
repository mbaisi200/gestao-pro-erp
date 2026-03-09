import { create } from 'zustand';
import { Tenant, Produto, ContaPagar, ContaReceber, Venda, OrdemServico, NotaFiscal, Cliente, Pedido, ConfigBanco, ConfigImpressora, ParametrosTenant, Funcionario, PermissoesAcesso, Fornecedor, UnidadeMedida } from '@/types';
import { Categoria, DashboardMetrics, PlanoAssinatura, User } from '@/types';
import { mockProdutos, mockCategorias, mockContasPagar, mockContasReceber, mockVendas, mockOrdensServico, mockNotasFiscais, mockClientes, mockDashboardMetrics, mockTenantsAdmin, mockPlanos, mockPedidos, mockFornecedores, mockFuncionarios } from '@/data/mock';
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

export type Module = 'dashboard' | 'produtos' | 'estoque' | 'financeiro' | 'faturamento' | 'pdv' | 'pedidos' | 'operacional' | 'parametros' | 'admin' | 'funcionarios' | 'categorias' | 'fornecedores' | 'unidades';

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
  importarXML: (xmlContent: string) => Promise<NotaFiscal | null>;
  addNotaFiscal: (nota: NotaFiscal) => Promise<string>;
  deleteNotaFiscal: (id: string) => Promise<void>;

  // Admin
  tenants: Tenant[];
  planos: PlanoAssinatura[];
  loadTenants: () => Promise<void>;
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

export const useAppStore = create<AppState>((set, get) => ({
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
    const isAdminMaster = user.role === 'admin' && user.tenantId === 'admin-master';
    set({ isLoading: true, currentUser: user, currentTenant: tenant, isAdmin: isAdminMaster });
    
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
          get().loadFuncionarios()
        ]);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      set({
        produtos: mockProdutos,
        categorias: mockCategorias,
        contasPagar: mockContasPagar,
        contasReceber: mockContasReceber,
        vendas: mockVendas,
        pedidos: mockPedidos,
        clientes: mockClientes,
        ordensServico: mockOrdensServico,
        notasFiscais: mockNotasFiscais,
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
    if (!currentTenant) return;
    try {
      const produtos = await getProdutos(currentTenant.id);
      set({ produtos: produtos.length > 0 ? produtos : mockProdutos });
    } catch {
      set({ produtos: mockProdutos });
    }
  },
  
  loadCategorias: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const categorias = await getCategorias(currentTenant.id);
      set({ categorias: categorias.length > 0 ? categorias : mockCategorias });
    } catch {
      set({ categorias: mockCategorias });
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
    if (!currentTenant) return;
    try {
      const contas = await getContasPagar(currentTenant.id);
      set({ contasPagar: contas.length > 0 ? contas : mockContasPagar });
    } catch {
      set({ contasPagar: mockContasPagar });
    }
  },
  
  loadContasReceber: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const contas = await getContasReceber(currentTenant.id);
      set({ contasReceber: contas.length > 0 ? contas : mockContasReceber });
    } catch {
      set({ contasReceber: mockContasReceber });
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
    if (!currentTenant) return;
    try {
      const vendas = await getVendas(currentTenant.id);
      set({ vendas: vendas.length > 0 ? vendas : mockVendas });
    } catch {
      set({ vendas: mockVendas });
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
    if (!currentTenant) return;
    try {
      const pedidos = await getPedidos(currentTenant.id);
      set({ pedidos: pedidos.length > 0 ? pedidos : mockPedidos });
    } catch {
      set({ pedidos: mockPedidos });
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
    if (!currentTenant) return;
    try {
      const ordens = await getOrdensServico(currentTenant.id);
      set({ ordensServico: ordens.length > 0 ? ordens : mockOrdensServico });
    } catch {
      set({ ordensServico: mockOrdensServico });
    }
  },
  
  loadNotasFiscais: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const notas = await getNotasFiscais(currentTenant.id);
      set({ notasFiscais: notas.length > 0 ? notas : mockNotasFiscais });
    } catch {
      set({ notasFiscais: mockNotasFiscais });
    }
  },
  
  loadClientes: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const clientes = await getClientes(currentTenant.id);
      set({ clientes: clientes.length > 0 ? clientes : mockClientes });
    } catch {
      set({ clientes: mockClientes });
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

  addNotaFiscal: async (nota: NotaFiscal): Promise<string> => {
    try {
      const tenantId = get().currentTenant?.id;
      if (!tenantId) {
        throw new Error('Tenant não encontrado');
      }

      const { createNotaFiscal: createNotaFiscalFS } = await import('@/lib/firestore-service');
      const notaId = await createNotaFiscalFS(tenantId, nota);

      // Adicionar ao estado local
      set((state) => ({
        notasFiscais: [...state.notasFiscais, { ...nota, id: notaId }]
      }));

      console.log('Nota fiscal salva com ID:', notaId);
      return notaId;
    } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      throw error;
    }
  },

  deleteNotaFiscal: async (id: string) => {
    try {
      const tenantId = get().currentTenant?.id;
      if (!tenantId) {
        throw new Error('Tenant não encontrado');
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
      set({ tenants: tenants.length > 0 ? tenants : mockTenantsAdmin });
    } catch {
      set({ tenants: mockTenantsAdmin });
    }
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
    if (!currentTenant) return;
    try {
      // Buscar funcionários do Firestore
      const { getFuncionarios } = await import('@/lib/firestore-service');
      const funcionarios = await getFuncionarios(currentTenant.id);
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
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const { deleteFuncionario: deleteFuncionarioFS } = await import('@/lib/firestore-service');
      await deleteFuncionarioFS(currentTenant.id, id);
      set((state) => ({
        funcionarios: state.funcionarios.filter(f => f.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      set((state) => ({
        funcionarios: state.funcionarios.filter(f => f.id !== id)
      }));
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
      set({ produtos: produtos.length > 0 ? produtos : mockProdutos });
    });
    newSubscriptions.push(unsubProdutos);
    
    // Subscrever para categorias
    const unsubCategorias = subscribeCategorias(currentTenant.id, (categorias) => {
      set({ categorias: categorias.length > 0 ? categorias : mockCategorias });
    });
    newSubscriptions.push(unsubCategorias);
    
    // Subscrever para vendas
    const unsubVendas = subscribeVendas(currentTenant.id, (vendas) => {
      set({ vendas: vendas.length > 0 ? vendas : mockVendas });
    });
    newSubscriptions.push(unsubVendas);
    
    // Subscrever para clientes
    const unsubClientes = subscribeClientes(currentTenant.id, (clientes) => {
      set({ clientes: clientes.length > 0 ? clientes : mockClientes });
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
    if (!currentTenant) return;
    try {
      await createCliente(currentTenant.id, cliente);
      // O subscription vai atualizar automaticamente o estado
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      set((state) => ({ clientes: [...state.clientes, cliente] }));
    }
  },
  
  updateClienteStore: async (id: string, data: Partial<Cliente>) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await updateCliente(currentTenant.id, id, data);
      // O subscription vai atualizar automaticamente o estado
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      set((state) => ({
        clientes: state.clientes.map(c => c.id === id ? { ...c, ...data } : c)
      }));
    }
  },
  
  deleteClienteStore: async (id: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      await deleteCliente(currentTenant.id, id);
      // O subscription vai atualizar automaticamente o estado
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      set((state) => ({
        clientes: state.clientes.filter(c => c.id !== id)
      }));
    }
  },
  
  // Fornecedores
  fornecedores: [],
  
  loadFornecedores: async () => {
    const { currentTenant } = get();
    if (!currentTenant) return;
    try {
      const fornecedores = await getFornecedoresFS(currentTenant.id);
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
}));
