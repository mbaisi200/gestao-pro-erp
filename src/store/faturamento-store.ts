import { create } from 'zustand';
import { NotaFiscal, Venda } from '@/types';
import { mockNotasFiscais, mockVendas } from '@/lib/mock-data';

interface FaturamentoState {
  notasFiscais: NotaFiscal[];
  vendas: Venda[];
  notaSelecionada: NotaFiscal | null;
  
  // Actions
  setNotaSelecionada: (nota: NotaFiscal | null) => void;
  adicionarNotaFiscal: (nota: NotaFiscal) => void;
  atualizarNotaFiscal: (id: string, nota: Partial<NotaFiscal>) => void;
  adicionarVenda: (venda: Venda) => void;
  cancelarVenda: (id: string) => void;
  
  // Computed
  getNotasPorStatus: (status: string) => NotaFiscal[];
  getTotalVendas: (periodo?: { inicio: Date; fim: Date }) => number;
}

export const useFaturamentoStore = create<FaturamentoState>((set, get) => ({
  notasFiscais: mockNotasFiscais,
  vendas: mockVendas,
  notaSelecionada: null,
  
  setNotaSelecionada: (nota) => set({ notaSelecionada: nota }),
  
  adicionarNotaFiscal: (nota) => {
    set((state) => ({
      notasFiscais: [...state.notasFiscais, nota]
    }));
  },
  
  atualizarNotaFiscal: (id, notaData) => {
    set((state) => ({
      notasFiscais: state.notasFiscais.map(n =>
        n.id === id ? { ...n, ...notaData } : n
      )
    }));
  },
  
  adicionarVenda: (venda) => {
    set((state) => ({
      vendas: [...state.vendas, venda]
    }));
  },
  
  cancelarVenda: (id) => {
    set((state) => ({
      vendas: state.vendas.map(v =>
        v.id === id ? { ...v, status: 'cancelada' as const } : v
      )
    }));
  },
  
  getNotasPorStatus: (status) => {
    const state = get();
    return state.notasFiscais.filter(n => n.status === status);
  },
  
  getTotalVendas: (periodo) => {
    const state = get();
    let vendas = state.vendas.filter(v => v.status === 'finalizada');
    
    if (periodo) {
      vendas = vendas.filter(v => {
        const data = new Date(v.dataCriacao);
        return data >= periodo.inicio && data <= periodo.fim;
      });
    }
    
    return vendas.reduce((acc, v) => acc + v.total, 0);
  }
}));
