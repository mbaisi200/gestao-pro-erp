import { create } from 'zustand';
import { OrdemServico, Entrega, StatusOS, StatusEntrega } from '@/types';
import { mockOrdensServico, mockEntregas } from '@/lib/mock-data';

interface OperacionalState {
  ordensServico: OrdemServico[];
  entregas: Entrega[];
  osSelecionada: OrdemServico | null;
  entregaSelecionada: Entrega | null;
  abaAtiva: 'os' | 'entregas';
  
  // Actions
  setOsSelecionada: (os: OrdemServico | null) => void;
  setEntregaSelecionada: (entrega: Entrega | null) => void;
  setAbaAtiva: (aba: 'os' | 'entregas') => void;
  adicionarOS: (os: OrdemServico) => void;
  atualizarOS: (id: string, os: Partial<OrdemServico>) => void;
  alterarStatusOS: (id: string, status: StatusOS) => void;
  adicionarEntrega: (entrega: Entrega) => void;
  atualizarEntrega: (id: string, entrega: Partial<Entrega>) => void;
  alterarStatusEntrega: (id: string, status: StatusEntrega) => void;
  
  // Computed
  getOSPorStatus: (status: StatusOS) => OrdemServico[];
  getEntregasPorStatus: (status: StatusEntrega) => Entrega[];
  getOSAbertas: () => OrdemServico[];
  getEntregasPendentes: () => Entrega[];
}

export const useOperacionalStore = create<OperacionalState>((set, get) => ({
  ordensServico: mockOrdensServico,
  entregas: mockEntregas,
  osSelecionada: null,
  entregaSelecionada: null,
  abaAtiva: 'os',
  
  setOsSelecionada: (os) => set({ osSelecionada: os }),
  
  setEntregaSelecionada: (entrega) => set({ entregaSelecionada: entrega }),
  
  setAbaAtiva: (abaAtiva) => set({ abaAtiva }),
  
  adicionarOS: (os) => {
    set((state) => ({
      ordensServico: [...state.ordensServico, os]
    }));
  },
  
  atualizarOS: (id, osData) => {
    set((state) => ({
      ordensServico: state.ordensServico.map(o =>
        o.id === id ? { ...o, ...osData } : o
      )
    }));
  },
  
  alterarStatusOS: (id, status) => {
    set((state) => ({
      ordensServico: state.ordensServico.map(o =>
        o.id === id ? { ...o, status } : o
      )
    }));
  },
  
  adicionarEntrega: (entrega) => {
    set((state) => ({
      entregas: [...state.entregas, entrega]
    }));
  },
  
  atualizarEntrega: (id, entregaData) => {
    set((state) => ({
      entregas: state.entregas.map(e =>
        e.id === id ? { ...e, ...entregaData } : e
      )
    }));
  },
  
  alterarStatusEntrega: (id, status) => {
    set((state) => ({
      entregas: state.entregas.map(e =>
        e.id === id ? { ...e, status } : e
      )
    }));
  },
  
  getOSPorStatus: (status) => {
    const state = get();
    return state.ordensServico.filter(o => o.status === status);
  },
  
  getEntregasPorStatus: (status) => {
    const state = get();
    return state.entregas.filter(e => e.status === status);
  },
  
  getOSAbertas: () => {
    const state = get();
    return state.ordensServico.filter(o => 
      o.status === 'aberta' || o.status === 'em_andamento' || o.status === 'aguardando_pecas'
    );
  },
  
  getEntregasPendentes: () => {
    const state = get();
    return state.entregas.filter(e => e.status === 'pendente' || e.status === 'em_rota');
  }
}));
