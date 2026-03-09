import { create } from 'zustand';
import { Produto, ItemVenda, FormaPagamento } from '@/types';

interface PDVState {
  itens: ItemVenda[];
  cliente: string;
  clienteId?: string;
  formaPagamento: FormaPagamento;
  desconto: number;
  acrescimo: number;
  valorPago: number;
  observacoes: string;
  
  // Actions
  adicionarItem: (produto: Produto, quantidade?: number) => void;
  removerItem: (itemId: string) => void;
  atualizarQuantidade: (itemId: string, quantidade: number) => void;
  atualizarDesconto: (desconto: number) => void;
  atualizarAcrescimo: (acrescimo: number) => void;
  atualizarFormaPagamento: (forma: FormaPagamento) => void;
  atualizarValorPago: (valor: number) => void;
  atualizarCliente: (cliente: string, clienteId?: string) => void;
  atualizarObservacoes: (obs: string) => void;
  limparCarrinho: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getTroco: () => number;
}

export const usePDVStore = create<PDVState>((set, get) => ({
  itens: [],
  cliente: '',
  clienteId: undefined,
  formaPagamento: 'dinheiro',
  desconto: 0,
  acrescimo: 0,
  valorPago: 0,
  observacoes: '',
  
  adicionarItem: (produto, quantidade = 1) => {
    set((state) => {
      const existingItem = state.itens.find(item => item.produtoId === produto.id);
      
      if (existingItem) {
        return {
          itens: state.itens.map(item =>
            item.produtoId === produto.id
              ? {
                  ...item,
                  quantidade: item.quantidade + quantidade,
                  valorTotal: (item.quantidade + quantidade) * item.valorUnitario
                }
              : item
          )
        };
      }
      
      const novoItem: ItemVenda = {
        id: `item-${Date.now()}`,
        produtoId: produto.id,
        produto,
        codigo: produto.codigo,
        descricao: produto.nome,
        quantidade,
        valorUnitario: produto.precoVenda,
        desconto: 0,
        acrescimo: 0,
        valorTotal: quantidade * produto.precoVenda
      };
      
      return { itens: [...state.itens, novoItem] };
    });
  },
  
  removerItem: (itemId) => {
    set((state) => ({
      itens: state.itens.filter(item => item.id !== itemId)
    }));
  },
  
  atualizarQuantidade: (itemId, quantidade) => {
    set((state) => ({
      itens: state.itens.map(item =>
        item.id === itemId
          ? { ...item, quantidade, valorTotal: quantidade * item.valorUnitario }
          : item
      )
    }));
  },
  
  atualizarDesconto: (desconto) => set({ desconto }),
  
  atualizarAcrescimo: (acrescimo) => set({ acrescimo }),
  
  atualizarFormaPagamento: (formaPagamento) => set({ formaPagamento }),
  
  atualizarValorPago: (valorPago) => set({ valorPago }),
  
  atualizarCliente: (cliente, clienteId) => set({ cliente, clienteId }),
  
  atualizarObservacoes: (observacoes) => set({ observacoes }),
  
  limparCarrinho: () => set({
    itens: [],
    cliente: '',
    clienteId: undefined,
    formaPagamento: 'dinheiro',
    desconto: 0,
    acrescimo: 0,
    valorPago: 0,
    observacoes: ''
  }),
  
  getSubtotal: () => {
    const state = get();
    return state.itens.reduce((acc, item) => acc + item.valorTotal, 0);
  },
  
  getTotal: () => {
    const state = get();
    const subtotal = state.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    return subtotal - state.desconto + state.acrescimo;
  },
  
  getTroco: () => {
    const state = get();
    const total = state.itens.reduce((acc, item) => acc + item.valorTotal, 0) - state.desconto + state.acrescimo;
    return Math.max(0, state.valorPago - total);
  }
}));
