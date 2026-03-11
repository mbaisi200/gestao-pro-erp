import { create } from 'zustand';
import { ContaPagar, ContaReceber, CategoriaFinanceira, StatusConta, FiltroFinanceiro } from '@/types';
import { mockContasPagar, mockContasReceber, mockCategoriasFinanceiras } from '@/lib/mock-data';

interface FinanceiroState {
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  categorias: CategoriaFinanceira[];
  filtros: FiltroFinanceiro;
  abaAtiva: 'pagar' | 'receber' | 'fluxo';
  
  // Actions
  setFiltros: (filtros: FiltroFinanceiro) => void;
  setAbaAtiva: (aba: 'pagar' | 'receber' | 'fluxo') => void;
  adicionarContaPagar: (conta: ContaPagar) => void;
  atualizarContaPagar: (id: string, conta: Partial<ContaPagar>) => void;
  excluirContaPagar: (id: string) => void;
  marcarComoPago: (id: string) => void;
  adicionarContaReceber: (conta: ContaReceber) => void;
  atualizarContaReceber: (id: string, conta: Partial<ContaReceber>) => void;
  excluirContaReceber: (id: string) => void;
  marcarComoRecebido: (id: string) => void;
  
  // Computed
  getContasPagarFiltradas: () => ContaPagar[];
  getContasReceberFiltradas: () => ContaReceber[];
  getTotalContasPagar: (status?: StatusConta) => number;
  getTotalContasReceber: (status?: StatusConta) => number;
  getContasVencidas: () => { pagar: ContaPagar[]; receber: ContaReceber[] };
}

export const useFinanceiroStore = create<FinanceiroState>((set, get) => ({
  contasPagar: mockContasPagar,
  contasReceber: mockContasReceber,
  categorias: mockCategoriasFinanceiras,
  filtros: {},
  abaAtiva: 'pagar',
  
  setFiltros: (filtros) => set({ filtros }),
  
  setAbaAtiva: (abaAtiva) => set({ abaAtiva }),
  
  adicionarContaPagar: (conta) => {
    set((state) => ({
      contasPagar: [...state.contasPagar, conta]
    }));
  },
  
  atualizarContaPagar: (id, contaData) => {
    set((state) => ({
      contasPagar: state.contasPagar.map(c =>
        c.id === id ? { ...c, ...contaData } : c
      )
    }));
  },
  
  excluirContaPagar: (id) => {
    set((state) => ({
      contasPagar: state.contasPagar.filter(c => c.id !== id)
    }));
  },
  
  marcarComoPago: (id) => {
    set((state) => ({
      contasPagar: state.contasPagar.map(c =>
        c.id === id ? { ...c, status: 'pago' as StatusConta, dataPagamento: new Date() } : c
      )
    }));
  },
  
  adicionarContaReceber: (conta) => {
    set((state) => ({
      contasReceber: [...state.contasReceber, conta]
    }));
  },
  
  atualizarContaReceber: (id, contaData) => {
    set((state) => ({
      contasReceber: state.contasReceber.map(c =>
        c.id === id ? { ...c, ...contaData } : c
      )
    }));
  },
  
  excluirContaReceber: (id) => {
    set((state) => ({
      contasReceber: state.contasReceber.filter(c => c.id !== id)
    }));
  },
  
  marcarComoRecebido: (id) => {
    set((state) => ({
      contasReceber: state.contasReceber.map(c =>
        c.id === id ? { ...c, status: 'pago' as StatusConta, dataRecebimento: new Date() } : c
      )
    }));
  },
  
  getContasPagarFiltradas: () => {
    const state = get();
    let contas = state.contasPagar;
    
    if (state.filtros.busca) {
      const busca = state.filtros.busca.toLowerCase();
      contas = contas.filter(c =>
        c.descricao.toLowerCase().includes(busca) ||
        c.fornecedor.toLowerCase().includes(busca)
      );
    }
    
    if (state.filtros.status) {
      contas = contas.filter(c => c.status === state.filtros.status);
    }
    
    if (state.filtros.categoriaId) {
      contas = contas.filter(c => c.categoriaId === state.filtros.categoriaId);
    }
    
    return contas;
  },
  
  getContasReceberFiltradas: () => {
    const state = get();
    let contas = state.contasReceber;
    
    if (state.filtros.busca) {
      const busca = state.filtros.busca.toLowerCase();
      contas = contas.filter(c =>
        c.descricao.toLowerCase().includes(busca) ||
        c.cliente.toLowerCase().includes(busca)
      );
    }
    
    if (state.filtros.status) {
      contas = contas.filter(c => c.status === state.filtros.status);
    }
    
    if (state.filtros.categoriaId) {
      contas = contas.filter(c => c.categoriaId === state.filtros.categoriaId);
    }
    
    return contas;
  },
  
  getTotalContasPagar: (status) => {
    const state = get();
    const contas = status 
      ? state.contasPagar.filter(c => c.status === status)
      : state.contasPagar;
    return contas.reduce((acc, c) => acc + c.valor, 0);
  },
  
  getTotalContasReceber: (status) => {
    const state = get();
    const contas = status
      ? state.contasReceber.filter(c => c.status === status)
      : state.contasReceber;
    return contas.reduce((acc, c) => acc + c.valor, 0);
  },
  
  getContasVencidas: () => {
    const state = get();
    const hoje = new Date();
    
    return {
      pagar: state.contasPagar.filter(c => 
        c.status === 'vencido' || (c.status === 'pendente' && new Date(c.dataVencimento) < hoje)
      ),
      receber: state.contasReceber.filter(c =>
        c.status === 'vencido' || (c.status === 'pendente' && new Date(c.dataVencimento) < hoje)
      )
    };
  }
}));
