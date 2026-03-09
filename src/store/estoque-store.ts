import { create } from 'zustand';
import { Produto, Categoria, MovimentacaoEstoque, FiltroProduto } from '@/types';
import { mockProdutos, mockCategorias, mockMovimentacoes } from '@/lib/mock-data';

interface EstoqueState {
  produtos: Produto[];
  categorias: Categoria[];
  movimentacoes: MovimentacaoEstoque[];
  filtros: FiltroProduto;
  produtoSelecionado: Produto | null;
  
  // Actions
  setFiltros: (filtros: FiltroProduto) => void;
  setProdutoSelecionado: (produto: Produto | null) => void;
  adicionarProduto: (produto: Produto) => void;
  atualizarProduto: (id: string, produto: Partial<Produto>) => void;
  excluirProduto: (id: string) => void;
  adicionarCategoria: (categoria: Categoria) => void;
  registrarMovimentacao: (movimentacao: MovimentacaoEstoque) => void;
  
  // Computed
  getProdutosFiltrados: () => Produto[];
  getProdutosEstoqueBaixo: () => Produto[];
  getProdutosPorCategoria: (categoriaId: string) => Produto[];
}

export const useEstoqueStore = create<EstoqueState>((set, get) => ({
  produtos: mockProdutos,
  categorias: mockCategorias,
  movimentacoes: mockMovimentacoes,
  filtros: {},
  produtoSelecionado: null,
  
  setFiltros: (filtros) => set({ filtros }),
  
  setProdutoSelecionado: (produto) => set({ produtoSelecionado: produto }),
  
  adicionarProduto: (produto) => {
    set((state) => ({
      produtos: [...state.produtos, produto]
    }));
  },
  
  atualizarProduto: (id, produtoData) => {
    set((state) => ({
      produtos: state.produtos.map(p =>
        p.id === id ? { ...p, ...produtoData, dataAtualizacao: new Date() } : p
      )
    }));
  },
  
  excluirProduto: (id) => {
    set((state) => ({
      produtos: state.produtos.filter(p => p.id !== id)
    }));
  },
  
  adicionarCategoria: (categoria) => {
    set((state) => ({
      categorias: [...state.categorias, categoria]
    }));
  },
  
  registrarMovimentacao: (movimentacao) => {
    set((state) => ({
      movimentacoes: [...state.movimentacoes, movimentacao],
      produtos: state.produtos.map(p =>
        p.id === movimentacao.produtoId
          ? { ...p, estoqueAtual: movimentacao.estoqueAtual }
          : p
      )
    }));
  },
  
  getProdutosFiltrados: () => {
    const state = get();
    let produtos = state.produtos;
    
    if (state.filtros.busca) {
      const busca = state.filtros.busca.toLowerCase();
      produtos = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca) ||
        p.codigo.toLowerCase().includes(busca)
      );
    }
    
    if (state.filtros.categoriaId) {
      produtos = produtos.filter(p => p.categoriaId === state.filtros.categoriaId);
    }
    
    if (state.filtros.estoqueBaixo) {
      produtos = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo);
    }
    
    if (state.filtros.ativo !== undefined) {
      produtos = produtos.filter(p => p.ativo === state.filtros.ativo);
    }
    
    return produtos;
  },
  
  getProdutosEstoqueBaixo: () => {
    const state = get();
    return state.produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo);
  },
  
  getProdutosPorCategoria: (categoriaId) => {
    const state = get();
    return state.produtos.filter(p => p.categoriaId === categoriaId);
  }
}));
