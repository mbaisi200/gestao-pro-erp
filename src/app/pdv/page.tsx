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

export default function PDVPage() {
  const { user, logout } = useAuthStore();
  const { produtos, categorias, clientes, addPedido, addCliente } = useAppStore();
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
  const [clienteSelecionado, setClienteSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [dialogCliente, setDialogCliente] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [dialogNovoCliente, setDialogNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [formasPagamentoRegistros, setFormasPagamentoRegistros] = useState<FormaPagamentoRegistro[]>([]);
  const [formaPagamentoAtiva, setFormaPagamentoAtiva] = useState<string>('');
  const [valorPagamento, setValorPagamento] = useState<string>('');
  const [dialogDesconto, setDialogDesconto] = useState(false);
  const [descontoPercentual, setDescontoPercentual] = useState<string>('0');
  const [pendentes, setPendentes] = useState<ItemCarrinho[][]>([]);
  const [dialogBuscaAvancada, setDialogBuscaAvancada] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);

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

  // Top 10 mais vendidos (simulado)
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

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    if (!searchCliente) return clientes;
    const searchLower = searchCliente.toLowerCase();
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(searchLower) ||
      (c.cpfCnpj && c.cpfCnpj.includes(searchCliente))
    );
  }, [clientes, searchCliente]);

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
    if (!formaPagamentoAtiva || !valorPagamento) {
      toast({ variant: 'destructive', title: 'Selecione a forma e informe o valor' });
      return;
    }
    
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

  // Selecionar cliente
  const selecionarCliente = (cliente: { id: string; nome: string }) => {
    setClienteSelecionado(cliente);
    setDialogCliente(false);
    toast({ title: `✓ Cliente selecionado: ${cliente.nome}` });
  };

  // Selecionar cliente balcão
  const selecionarClienteBalcao = () => {
    setClienteSelecionado({ id: 'balcao', nome: 'Cliente Balcão' });
    setDialogCliente(false);
    toast({ title: 'Cliente Balcão selecionado' });
  };

  // Criar novo cliente
  const criarNovoCliente = async () => {
    if (!novoClienteNome.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome do cliente' });
      return;
    }

    try {
      const novoCliente = {
        id: `cliente-${Date.now()}`,
        nome: novoClienteNome,
        ativo: true,
        dataCriacao: new Date(),
      };
      
      await addCliente(novoCliente);
      setClienteSelecionado({ id: novoCliente.id, nome: novoCliente.nome });
      setDialogNovoCliente(false);
      setNovoClienteNome('');
      toast({ title: `✓ Cliente cadastrado: ${novoClienteNome}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar cliente' });
    }
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
        clienteId: clienteSelecionado?.id || undefined,
        itens: carrinho.map(item => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco,
          total: item.preco * item.quantidade,
        })),
        subtotal,
        desconto,
        total,
        formaPagamento: formasPagamentoRegistros.map(f => f.tipo).join(', ') || 'Não definido',
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

  // Carregar pendente
  const carregarPendente = (index: number) => {
    if (pendentes[index]) {
      setCarrinho(pendentes[index]);
      setPendentes(pendentes.filter((_, i) => i !== index));
      toast({ title: '✓ Venda pendente carregada' });
    }
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
      if (e.key === 'F2' && e.shiftKey) {
        e.preventDefault();
        setDialogBuscaAvancada(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setDialogCliente(true);
      }
      if (e.key === 'F6') {
        e.preventDefault();
        if (carrinho.length > 0) setDialogDesconto(true);
      }
      if (e.key === 'F7') {
        e.preventDefault();
        setDialogHistorico(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        salvarPendente();
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (carrinho.length > 0) setDialogPagamento(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho]);

  // Formas de pagamento
  const formasPagamento = [
    { id: 'Crédito', nome: 'Crédito', icone: CreditCard, cor: 'bg-purple-500' },
    { id: 'Débito', nome: 'Débito', icone: CreditCard, cor: 'bg-orange-500' },
    { id: 'Pix', nome: 'Transf / Pix', icone: Smartphone, cor: 'bg-blue-500' },
    { id: 'Dinheiro', nome: 'Dinheiro', icone: Banknote, cor: 'bg-green-500' },
  ];

  // Calcular troco
  const valorRecebido = parseFloat(troco) || 0;
  const valorTroco = valorRecebido > totalPago ? valorRecebido - totalPago : 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* HEADER */}
      <header className="bg-white border-b border-blue-100 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Logo e Sistema */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">PDV Premium</p>
              <p className="text-xs text-gray-500">Sistema de Ponto de Venda</p>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-10 bg-blue-200" />
          
          {/* Status Venda */}
          <Badge className="bg-green-100 text-green-700 border border-green-200 px-4 py-1.5 text-sm font-bold tracking-wide">
            VENDA
          </Badge>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Data/Hora */}
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">{formatarDataHora(dataHora)}</span>
          </div>
          
          <Separator orientation="vertical" className="h-10 bg-blue-200" />
          
          {/* Usuário */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <span className="font-semibold text-gray-700">{user?.nome || 'Usuário'}</span>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleLogout} 
            className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            SAIR
          </Button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL - 3 COLUNAS */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        
        {/* COLUNA ESQUERDA - BUSCA DE PRODUTOS */}
        <div className="w-80 flex flex-col overflow-hidden bg-white rounded-xl border border-blue-100 shadow-sm">
          {/* Header */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-gray-800">Buscar Produto</span>
              </div>
              <Badge className="bg-blue-100 text-blue-600 text-xs font-mono">F2</Badge>
            </div>
          </div>
          
          {/* Input de busca */}
          <div className="p-3 border-b border-blue-100 shrink-0">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="search-input"
                placeholder="Buscar produto ou serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 rounded-lg h-11"
                autoFocus
              />
            </div>
          </div>
          
          {/* Filtros */}
          <div className="px-3 py-2 border-b border-blue-100 shrink-0">
            <div className="flex gap-1.5">
              {filtros.map((filtro) => (
                <Button
                  key={filtro}
                  size="sm"
                  variant={filtroAtivo === filtro ? 'default' : 'outline'}
                  className={`flex-1 font-semibold text-xs h-8 ${
                    filtroAtivo === filtro 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
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
            <div className="px-4 py-2 border-b border-blue-100 bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-gray-600 text-sm">Top 10 Mais Vendidos</span>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
                {top10MaisVendidos.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum produto cadastrado</p>
                  </div>
                ) : (
                  top10MaisVendidos.map((item, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left group"
                      onClick={() => adicionarProduto(item.produto)}
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                          {item.nome}
                        </p>
                        <p className="text-green-600 font-bold text-sm">
                          R$ {item.preco.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Ações */}
          <div className="p-3 border-t border-blue-100 bg-gray-50 shrink-0 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-blue-200 text-gray-600 hover:text-gray-800 hover:bg-blue-50"
              onClick={() => setDialogBuscaAvancada(true)}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Busca Avançada</span>
              <Badge className="bg-gray-200 text-gray-500 text-xs font-mono">Shift + F2</Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-blue-200 text-gray-600 hover:text-gray-800 hover:bg-blue-50"
              onClick={() => setDialogHistorico(true)}
            >
              <History className="h-4 w-4" />
              <span className="flex-1 text-left">Histórico de compras</span>
              <Badge className="bg-gray-200 text-gray-500 text-xs font-mono">F7</Badge>
            </Button>
          </div>
        </div>

        {/* COLUNA CENTRAL - CLIENTE E CARRINHO */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-blue-100 shadow-sm">
          {/* Seção Cliente */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center">
                  {clienteSelecionado ? (
                    <User className="h-5 w-5 text-blue-600" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${clienteSelecionado ? 'text-blue-700' : 'text-gray-500'}`}>
                    {clienteSelecionado?.nome || 'Selecione um cliente'}
                  </p>
                  {clienteSelecionado && (
                    <p className="text-xs text-gray-500">Cliente selecionado</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  onClick={selecionarClienteBalcao}
                >
                  Cliente Balcão
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  onClick={() => setDialogNovoCliente(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Novo Cliente
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-100 gap-1"
                  onClick={() => setDialogCliente(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Trocar
                  <Badge className="bg-blue-100 text-blue-600 text-xs font-mono ml-1">F4</Badge>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Header do Carrinho */}
          <div className="bg-gray-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-gray-800">Carrinho</span>
              {carrinho.length > 0 && (
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    {totalItens} itens
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700">
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
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-1"
                  onClick={() => setDialogDesconto(true)}
                >
                  <Percent className="h-4 w-4" />
                  Desconto
                  <Badge className="bg-blue-100 text-blue-600 text-xs font-mono ml-1">F6</Badge>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
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
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-20 w-20 mb-4 opacity-30" />
                <p className="font-semibold text-lg">Carrinho vazio</p>
                <p className="text-sm">Selecione produtos para adicionar</p>
                {pendentes.length > 0 && (
                  <div className="mt-4 w-full px-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Vendas pendentes:</p>
                    {pendentes.map((p, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full mb-1 justify-start"
                        onClick={() => carregarPendente(i)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Pendente {i + 1} - {p.length} itens
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {carrinho.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:border-blue-300 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{item.nome}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
                              onClick={() => alterarQuantidade(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-lg text-gray-800 w-8 text-center">{item.quantidade}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
                              onClick={() => alterarQuantidade(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">R$ {item.preco.toFixed(2)} x {item.quantidade}</p>
                            <p className="text-green-600 font-bold">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
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
            <div className="p-3 border-t border-blue-100 shrink-0">
              <Textarea
                placeholder="Observação do pedido..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="border-blue-200 focus:border-blue-500 resize-none h-16"
              />
            </div>
          )}
        </div>

        {/* COLUNA DIREITA - PAGAMENTO E RESUMO */}
        <div className="w-96 flex flex-col overflow-hidden bg-white rounded-xl border border-blue-100 shadow-sm">
          {/* Formas de Pagamento */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-gray-800">Forma de Pagamento</span>
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
                        : 'border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
                  className="border-blue-200 focus:border-blue-500"
                />
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={adicionarFormaPagamento}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Registros de Pagamento */}
          {formasPagamentoRegistros.length > 0 && (
            <div className="border-b border-blue-100 px-4 py-2 shrink-0">
              <div className="space-y-1.5">
                {formasPagamentoRegistros.map((registro) => {
                  const forma = formasPagamento.find(f => f.id === registro.tipo);
                  return (
                    <div key={registro.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded ${forma?.cor || 'bg-gray-400'} flex items-center justify-center`}>
                          {forma && <forma.icone className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-gray-700 text-sm">{registro.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">R$ {registro.valor.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
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
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800 font-semibold">R$ {subtotal.toFixed(2)}</span>
                </div>
                
                {/* Desconto */}
                {parseFloat(descontoPercentual) > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span>Desconto ({descontoPercentual}%)</span>
                    <span className="font-semibold">- R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="bg-blue-100" />
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold text-lg">Total</span>
                  <span className="text-green-600 font-extrabold text-2xl">R$ {total.toFixed(2)}</span>
                </div>
                
                <Separator className="bg-blue-100" />
                
                {/* Pago */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pago</span>
                  <span className="text-blue-600 font-semibold">R$ {totalPago.toFixed(2)}</span>
                </div>
                
                {/* Restante */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Restante</span>
                  <span className={`font-bold text-lg ${restante > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    R$ {Math.abs(restante).toFixed(2)}
                  </span>
                </div>
                
                {/* Troco */}
                {valorTroco > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-semibold">Troco</span>
                      <span className="text-green-600 font-extrabold text-xl">R$ {valorTroco.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="p-4 border-t border-blue-100 bg-gray-50 space-y-2 shrink-0">
              <Button
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
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
                  className="h-11 font-semibold border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={salvarPendente}
                  disabled={carrinho.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Pendente
                  <Badge className="bg-blue-100 text-blue-600 ml-1 text-xs font-mono">F8</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 font-semibold border-red-200 text-red-600 hover:bg-red-50"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Confirme os dados para finalizar a venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {parseFloat(descontoPercentual) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({descontoPercentual}%):</span>
                    <span>- R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-green-600 font-bold text-xl">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Pago:</span>
                  <span>R$ {totalPago.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>Restante:</span>
                  <span>R$ {restante.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {restante > 0 && (
              <div className="space-y-2">
                <Label>Valor adicional recebido</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                />
                {valorTroco > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700">Troco: <span className="font-bold">R$ {valorTroco.toFixed(2)}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagamento(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={finalizarVenda} 
              disabled={processando || totalPago < total}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Selecionar Cliente */}
      <Dialog open={dialogCliente} onOpenChange={setDialogCliente}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
            <DialogDescription>
              Escolha ou cadastre um cliente para esta venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {clientesFiltrados.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-blue-300 transition-all text-left"
                      onClick={() => selecionarCliente({ id: cliente.id, nome: cliente.nome })}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{cliente.nome}</p>
                        {cliente.cpfCnpj && (
                          <p className="text-sm text-gray-500">{cliente.cpfCnpj}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={selecionarClienteBalcao}
            >
              <User className="mr-2 h-4 w-4" />
              Cliente Balcão
            </Button>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDialogCliente(false);
                  setDialogNovoCliente(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
              <Button variant="outline" onClick={() => setDialogCliente(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Cliente */}
      <Dialog open={dialogNovoCliente} onOpenChange={setDialogNovoCliente}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome do cliente"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNovoCliente(false)}>
              Cancelar
            </Button>
            <Button onClick={criarNovoCliente} className="bg-blue-600 hover:bg-blue-700">
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Desconto */}
      <Dialog open={dialogDesconto} onOpenChange={setDialogDesconto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
            <DialogDescription>
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
                className="text-center text-xl font-bold"
              />
              <span className="text-2xl text-gray-400">%</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600 mb-1">
                <span>Desconto:</span>
                <span>- R$ {desconto.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-green-600 font-bold text-lg">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDesconto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => setDialogDesconto(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Busca Avançada */}
      <Dialog open={dialogBuscaAvancada} onOpenChange={setDialogBuscaAvancada}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Busca Avançada</DialogTitle>
            <DialogDescription>
              Pesquise produtos com filtros avançados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Digite para buscar..."
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-2">
                {produtosFiltrados.slice(0, 10).map((produto) => (
                  <button
                    key={produto.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    onClick={() => {
                      adicionarProduto(produto);
                      setDialogBuscaAvancada(false);
                    }}
                  >
                    <Package className="h-8 w-8 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{produto.nome}</p>
                      <p className="text-green-600 font-bold text-sm">R$ {(produto.precoVenda || 0).toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBuscaAvancada(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Compras</DialogTitle>
            <DialogDescription>
              Veja o histórico de compras do cliente selecionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {clienteSelecionado ? (
              <div className="text-center text-gray-500">
                <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma compra registrada</p>
                <p className="text-sm">para {clienteSelecionado.nome}</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Selecione um cliente</p>
                <p className="text-sm">para ver o histórico de compras</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHistorico(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
