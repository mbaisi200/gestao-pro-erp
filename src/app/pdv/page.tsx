'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore, Produto } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  LogOut,
  Package,
  User,
  Loader2,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle,
  X,
  Clock,
  UserPlus,
  RefreshCw,
  Percent,
  History,
  Barcode,
  DollarSign,
  TrendingUp,
  Receipt,
  Save,
  Ban,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ItemCarrinho {
  id: string;
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface FormaPagamentoRegistro {
  id: string;
  tipo: string;
  valor: number;
}

interface Cliente {
  id: string;
  nome: string;
}

export default function PDVPage() {
  const { user, logout } = useAuthStore();
  const { produtos, addPedido } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [filtroAtivo, setFiltroAtivo] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [troco, setTroco] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [dataHora, setDataHora] = useState(new Date());
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [dialogCliente, setDialogCliente] = useState(false);
  const [formasPagamentoRegistros, setFormasPagamentoRegistros] = useState<FormaPagamentoRegistro[]>([]);
  const [formaPagamentoAtiva, setFormaPagamentoAtiva] = useState<string>('');
  const [valorPagamento, setValorPagamento] = useState<string>('');
  const [dialogDesconto, setDialogDesconto] = useState(false);
  const [descontoPercentual, setDescontoPercentual] = useState<string>('0');
  const [pendentes, setPendentes] = useState<ItemCarrinho[][]>([]);

  // Atualizar data/hora
  useEffect(() => {
    const timer = setInterval(() => setDataHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatar data/hora
  const formatarDataHora = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  };

  // Filtros disponíveis
  const filtros = ['Todos', 'Serviços', 'Produtos', 'Histórico'];

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    let lista = produtos.filter(p => p.ativo);
    
    if (filtroAtivo === 'Produtos') {
      lista = lista.filter(p => p.tipo === 'produto');
    } else if (filtroAtivo === 'Serviços') {
      lista = lista.filter(p => p.tipo === 'servico');
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      lista = lista.filter(p => 
        p.nome.toLowerCase().includes(searchLower) ||
        (p.codigoBarras && p.codigoBarras.includes(search)) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchLower))
      );
    }
    return lista;
  }, [produtos, filtroAtivo, search]);

  // Top 10 mais vendidos (simulado - em produção viria do banco)
  const top10MaisVendidos = useMemo(() => {
    return produtos
      .filter(p => p.ativo && p.tipo === 'produto')
      .slice(0, 10)
      .map(p => ({
        nome: p.nome.length > 35 ? p.nome.substring(0, 35) + '...' : p.nome,
        preco: p.precoVenda || 0,
        produto: p
      }));
  }, [produtos]);

  // Total de itens no carrinho
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  
  // Total de unidades diferentes
  const totalUnidades = carrinho.length;

  // Subtotal
  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  
  // Desconto
  const desconto = subtotal * (parseFloat(descontoPercentual) / 100);
  
  // Total
  const total = subtotal - desconto;

  // Total pago
  const totalPago = formasPagamentoRegistros.reduce((acc, reg) => acc + reg.valor, 0);
  
  // Restante
  const restante = total - totalPago;

  // Adicionar produto ao carrinho
  const adicionarProduto = useCallback((produto: Produto) => {
    if (!produto.precoVenda || produto.precoVenda <= 0) {
      toast({ variant: 'destructive', title: 'Produto sem preço definido' });
      return;
    }

    const existente = carrinho.find(item => item.produtoId === produto.id);
    
    if (existente) {
      setCarrinho(carrinho.map(item => 
        item.id === existente.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        id: Date.now().toString(),
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.precoVenda,
        quantidade: 1,
      }]);
    }

    toast({ title: `✓ ${produto.nome} adicionado` });
  }, [carrinho, toast]);

  // Alterar quantidade
  const alterarQuantidade = (itemId: string, delta: number) => {
    const item = carrinho.find(i => i.id === itemId);
    if (!item) return;

    const novaQtd = item.quantidade + delta;
    
    if (novaQtd <= 0) {
      setCarrinho(carrinho.filter(i => i.id !== itemId));
    } else {
      setCarrinho(carrinho.map(i => 
        i.id === itemId ? { ...i, quantidade: novaQtd } : i
      ));
    }
  };

  // Remover item
  const removerItem = (itemId: string) => {
    setCarrinho(carrinho.filter(i => i.id !== itemId));
  };

  // Limpar carrinho
  const limparCarrinho = () => {
    setCarrinho([]);
    setFormasPagamentoRegistros([]);
    setDescontoPercentual('0');
    setObservacao('');
  };

  // Adicionar forma de pagamento
  const adicionarFormaPagamento = () => {
    if (!formaPagamentoAtiva || !valorPagamento) return;
    
    const valor = parseFloat(valorPagamento);
    if (isNaN(valor) || valor <= 0) {
      toast({ variant: 'destructive', title: 'Valor inválido' });
      return;
    }

    const novaForma: FormaPagamentoRegistro = {
      id: Date.now().toString(),
      tipo: formaPagamentoAtiva,
      valor: valor,
    };

    setFormasPagamentoRegistros([...formasPagamentoRegistros, novaForma]);
    setValorPagamento('');
    setFormaPagamentoAtiva('');
    
    toast({ title: `✓ ${formaPagamentoAtiva} adicionado: R$ ${valor.toFixed(2)}` });
  };

  // Remover forma de pagamento
  const removerFormaPagamento = (id: string) => {
    setFormasPagamentoRegistros(formasPagamentoRegistros.filter(f => f.id !== id));
  };

  // Selecionar cliente balcão
  const selecionarClienteBalcao = () => {
    setClienteSelecionado({ id: 'balcao', nome: 'Cliente Balcão' });
    setDialogCliente(false);
    toast({ title: 'Cliente Balcão selecionado' });
  };

  // Finalizar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione itens ao carrinho' });
      return;
    }

    if (totalPago < total) {
      toast({ variant: 'destructive', title: 'Valor pago insuficiente' });
      return;
    }

    setProcessando(true);
    try {
      const pedido = {
        id: `pedido-${Date.now()}`,
        tenantId: '',
        numero: Date.now().toString().slice(-6),
        nomeCliente: clienteSelecionado?.nome || 'Cliente Balcão',
        itens: carrinho.map(item => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco,
          total: item.preco * item.quantidade,
        })),
        subtotal,
        total,
        formaPagamento: formasPagamentoRegistros.map(f => f.tipo).join(', '),
        status: 'entregue' as const,
        tipo: 'balcao' as const,
        observacao,
        dataCriacao: new Date(),
        criadoPor: user?.id || '',
        criadoPorNome: user?.nome || '',
      };

      await addPedido(pedido);

      toast({ title: '✓ Venda finalizada com sucesso!' });
      setCarrinho([]);
      setDialogPagamento(false);
      setFormasPagamentoRegistros([]);
      setDescontoPercentual('0');
      setObservacao('');
      setClienteSelecionado(null);
      setTroco('');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({ variant: 'destructive', title: 'Erro ao finalizar venda' });
    } finally {
      setProcessando(false);
    }
  };

  // Salvar pendente
  const salvarPendente = () => {
    if (carrinho.length === 0) {
      toast({ variant: 'destructive', title: 'Carrinho vazio' });
      return;
    }
    setPendentes([...pendentes, [...carrinho]]);
    setCarrinho([]);
    setFormasPagamentoRegistros([]);
    toast({ title: `✓ Venda pendente salva (${pendentes.length + 1})` });
  };

  // Cancelar venda
  const cancelarVenda = () => {
    limparCarrinho();
    setClienteSelecionado(null);
    toast({ title: 'Venda cancelada' });
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Busca por código de barras
  useEffect(() => {
    if (!search || search.length < 8) return;
    
    const isCodigoBarras = /^[0-9]{8,}$/.test(search);
    
    if (isCodigoBarras) {
      const produtoEncontrado = produtos.find(p => p.codigoBarras === search);
      
      if (produtoEncontrado) {
        adicionarProduto(produtoEncontrado);
        setSearch('');
      }
    }
  }, [search, produtos, adicionarProduto]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setDialogCliente(true);
      }
      if (e.key === 'F6') {
        e.preventDefault();
        setDialogDesconto(true);
      }
      if (e.key === 'F7') {
        e.preventDefault();
        // Histórico de compras
        toast({ title: 'Histórico de compras' });
      }
      if (e.key === 'F8') {
        e.preventDefault();
        salvarPendente();
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (carrinho.length > 0) {
          setDialogPagamento(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho]);

  // Formas de pagamento
  const formasPagamento = [
    { id: 'Credito', nome: 'Crédito', icone: CreditCard, cor: 'bg-purple-500' },
    { id: 'Debito', nome: 'Débito', icone: CreditCard, cor: 'bg-orange-500' },
    { id: 'Pix', nome: 'Transf / Pix', icone: Smartphone, cor: 'bg-blue-500' },
    { id: 'Dinheiro', nome: 'Dinheiro', icone: Banknote, cor: 'bg-green-500' },
  ];

  // Calcular troco
  const valorRecebido = parseFloat(troco) || 0;
  const valorTroco = valorRecebido > totalPago ? valorRecebido - totalPago : 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* HEADER */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          {/* Logo e Sistema */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-white text-lg tracking-wide">PDV Premium</p>
              <p className="text-xs text-slate-400">Sistema de Ponto de Venda</p>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-10 bg-slate-600" />
          
          {/* Status Venda */}
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 text-sm font-bold tracking-wide">
            VENDA
          </Badge>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Data/Hora */}
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">{formatarDataHora(dataHora)}</span>
          </div>
          
          <Separator orientation="vertical" className="h-10 bg-slate-600" />
          
          {/* Usuário */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <span className="font-semibold text-white">{user?.nome || 'Usuário'}</span>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleLogout} 
            className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            SAIR
          </Button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL - 3 COLUNAS */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        
        {/* COLUNA ESQUERDA - BUSCA DE PRODUTOS */}
        <div className="w-80 flex flex-col overflow-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
          {/* Header */}
          <div className="bg-slate-700/50 border-b border-slate-600 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-white">Buscar Produto</span>
              </div>
              <Badge className="bg-slate-600 text-slate-300 text-xs font-mono">F2</Badge>
            </div>
          </div>
          
          {/* Input de busca */}
          <div className="p-3 border-b border-slate-700 shrink-0">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="search-input"
                placeholder="Buscar produto ou serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-11"
                autoFocus
              />
            </div>
          </div>
          
          {/* Filtros */}
          <div className="px-3 py-2 border-b border-slate-700 shrink-0">
            <div className="flex gap-1.5">
              {filtros.map((filtro) => (
                <Button
                  key={filtro}
                  size="sm"
                  variant={filtroAtivo === filtro ? 'default' : 'ghost'}
                  className={`flex-1 font-semibold text-xs h-8 ${
                    filtroAtivo === filtro 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  onClick={() => setFiltroAtivo(filtro)}
                >
                  {filtro}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Top 10 Mais Vendidos */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-slate-700 bg-slate-700/30 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-slate-300 text-sm">Top 10 Mais Vendidos</span>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
                {top10MaisVendidos.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-emerald-500/50 transition-all text-left group"
                    onClick={() => adicionarProduto(item.produto)}
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                        {item.nome}
                      </p>
                      <p className="text-emerald-400 font-bold text-sm">
                        R$ {item.preco.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Ações */}
          <div className="p-3 border-t border-slate-700 bg-slate-700/30 shrink-0 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
              onClick={() => toast({ title: 'Busca Avançada' })}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Busca Avançada</span>
              <Badge className="bg-slate-600 text-slate-400 text-xs font-mono">Shift + F2</Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
              onClick={() => toast({ title: 'Histórico de compras' })}
            >
              <History className="h-4 w-4" />
              <span className="flex-1 text-left">Histórico de compras</span>
              <Badge className="bg-slate-600 text-slate-400 text-xs font-mono">F7</Badge>
            </Button>
          </div>
        </div>

        {/* COLUNA CENTRAL - CLIENTE E CARRINHO */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
          {/* Seção Cliente */}
          <div className="bg-slate-700/50 border-b border-slate-600 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                  {clienteSelecionado ? (
                    <User className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${clienteSelecionado ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {clienteSelecionado?.nome || 'Selecione um cliente'}
                  </p>
                  {clienteSelecionado && (
                    <p className="text-xs text-slate-500">Cliente selecionado</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
                  onClick={selecionarClienteBalcao}
                >
                  Cliente Balcão
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
                  onClick={() => setDialogCliente(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Novo Cliente
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                  onClick={() => setDialogCliente(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Trocar
                  <Badge className="bg-slate-600 text-slate-400 text-xs font-mono ml-1">F4</Badge>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Header do Carrinho */}
          <div className="bg-slate-700/30 border-b border-slate-700 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
              <span className="font-bold text-white">Carrinho</span>
              {carrinho.length > 0 && (
                <div className="flex gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {totalItens} itens
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {totalUnidades} {totalUnidades === 1 ? 'unidade' : 'unidades'}
                  </Badge>
                </div>
              )}
            </div>
            
            {carrinho.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                  onClick={() => setDialogDesconto(true)}
                >
                  <Percent className="h-4 w-4" />
                  Desconto
                  <Badge className="bg-slate-600 text-slate-400 text-xs font-mono ml-1">F6</Badge>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                  onClick={limparCarrinho}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
            )}
          </div>
          
          {/* Itens do Carrinho */}
          <ScrollArea className="flex-1">
            {carrinho.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ShoppingCart className="h-20 w-20 mb-4 opacity-30" />
                <p className="font-semibold text-lg">Carrinho vazio</p>
                <p className="text-sm">Selecione produtos para adicionar</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {carrinho.map((item, index) => (
                  <div key={item.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-3 hover:border-slate-500 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-600 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{item.nome}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500"
                              onClick={() => alterarQuantidade(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-lg text-white w-8 text-center">{item.quantidade}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500"
                              onClick={() => alterarQuantidade(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">R$ {item.preco.toFixed(2)} x {item.quantidade}</p>
                            <p className="text-emerald-400 font-bold">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        onClick={() => removerItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Observação */}
          {carrinho.length > 0 && (
            <div className="p-3 border-t border-slate-700 shrink-0">
              <Textarea
                placeholder="Observação do pedido..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500 resize-none h-16"
              />
            </div>
          )}
        </div>

        {/* COLUNA DIREITA - PAGAMENTO E RESUMO */}
        <div className="w-96 flex flex-col overflow-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
          {/* Formas de Pagamento */}
          <div className="bg-slate-700/50 border-b border-slate-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span className="font-bold text-white">Forma de Pagamento</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {formasPagamento.map((forma) => {
                const Icone = forma.icone;
                const isActive = formaPagamentoAtiva === forma.id;
                return (
                  <Button
                    key={forma.id}
                    size="sm"
                    variant="outline"
                    className={`flex flex-col h-auto py-2 px-1 ${
                      isActive 
                        ? `${forma.cor} border-transparent text-white` 
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                    onClick={() => setFormaPagamentoAtiva(forma.id)}
                  >
                    <Icone className="h-4 w-4 mb-1" />
                    <span className="text-xs font-semibold">{forma.nome}</span>
                  </Button>
                );
              })}
            </div>
            
            {formaPagamentoAtiva && (
              <div className="mt-3 flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={adicionarFormaPagamento}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Registros de Pagamento */}
          {formasPagamentoRegistros.length > 0 && (
            <div className="border-b border-slate-700 px-4 py-2 shrink-0">
              <div className="space-y-1.5">
                {formasPagamentoRegistros.map((registro) => {
                  const forma = formasPagamento.find(f => f.id === registro.tipo);
                  return (
                    <div key={registro.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded ${forma?.cor || 'bg-slate-600'} flex items-center justify-center`}>
                          {forma && <forma.icone className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-slate-200 text-sm">{registro.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">R$ {registro.valor.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                          onClick={() => removerFormaPagamento(registro.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Resumo Financeiro */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-4 flex-1">
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-200 font-semibold">R$ {subtotal.toFixed(2)}</span>
                </div>
                
                {/* Desconto */}
                {parseFloat(descontoPercentual) > 0 && (
                  <div className="flex items-center justify-between text-red-400">
                    <span>Desconto ({descontoPercentual}%)</span>
                    <span className="font-semibold">- R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="bg-slate-600" />
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold text-lg">Total</span>
                  <span className="text-emerald-400 font-extrabold text-2xl">R$ {total.toFixed(2)}</span>
                </div>
                
                <Separator className="bg-slate-600" />
                
                {/* Pago */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pago</span>
                  <span className="text-blue-400 font-semibold">R$ {totalPago.toFixed(2)}</span>
                </div>
                
                {/* Restante */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Restante</span>
                  <span className={`font-bold text-lg ${restante > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    R$ {Math.abs(restante).toFixed(2)}
                  </span>
                </div>
                
                {/* Troco */}
                {valorTroco > 0 && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold">Troco</span>
                      <span className="text-emerald-400 font-extrabold text-xl">R$ {valorTroco.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="p-4 border-t border-slate-700 bg-slate-700/30 space-y-2 shrink-0">
              <Button
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                onClick={() => setDialogPagamento(true)}
                disabled={carrinho.length === 0}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                FINALIZAR VENDA
                <Badge className="bg-white/20 text-white ml-2 font-mono">F12</Badge>
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-11 font-semibold bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
                  onClick={salvarPendente}
                  disabled={carrinho.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Pendente
                  <Badge className="bg-slate-600 text-slate-400 ml-1 text-xs font-mono">F8</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 font-semibold bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                  onClick={cancelarVenda}
                  disabled={carrinho.length === 0}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Pagamento */}
      <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Finalizar Venda</DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirme os dados para finalizar a venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {parseFloat(descontoPercentual) > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Desconto ({descontoPercentual}%):</span>
                    <span>- R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-slate-600" />
                <div className="flex justify-between text-emerald-400 font-bold text-xl">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>Pago:</span>
                  <span>R$ {totalPago.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Restante:</span>
                  <span>R$ {restante.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {restante > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300">Valor adicional recebido</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {valorTroco > 0 && (
                  <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <p className="text-emerald-400">Troco: <span className="font-bold">R$ {valorTroco.toFixed(2)}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogPagamento(false)}
              className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={finalizarVenda} 
              disabled={processando || totalPago < total}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cliente */}
      <Dialog open={dialogCliente} onOpenChange={setDialogCliente}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Selecionar Cliente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Escolha ou cadastre um cliente para esta venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="Buscar cliente..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
                onClick={selecionarClienteBalcao}
              >
                <User className="mr-2 h-4 w-4" />
                Cliente Balcão
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Novo Cliente
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogCliente(false)}
              className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Desconto */}
      <Dialog open={dialogDesconto} onOpenChange={setDialogDesconto}>
        <DialogContent className="max-w-sm bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Aplicar Desconto</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informe o percentual de desconto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0"
                value={descontoPercentual}
                onChange={(e) => setDescontoPercentual(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-center text-xl font-bold"
              />
              <span className="text-2xl text-slate-400">%</span>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-400 mb-1">
                <span>Desconto:</span>
                <span>- R$ {desconto.toFixed(2)}</span>
              </div>
              <Separator className="bg-slate-600 my-2" />
              <div className="flex justify-between text-emerald-400 font-bold text-lg">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogDesconto(false)}
              className="bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => setDialogDesconto(false)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
