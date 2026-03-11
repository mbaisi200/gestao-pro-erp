'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore, Produto } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ItemCarrinho {
  id: string;
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function PDVPage() {
  const { user, logout } = useAuthStore();
  const { produtos, categorias, addPedido } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [troco, setTroco] = useState<string>('');
  const [observacao, setObservacao] = useState('');

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    let lista = produtos.filter(p => p.ativo && p.tipo === 'produto');
    if (categoriaAtiva !== 'todos') {
      lista = lista.filter(p => p.categoriaId === categoriaAtiva);
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
  }, [produtos, categoriaAtiva, search]);

  // Total do carrinho
  const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  // Adicionar produto ao carrinho
  const adicionarProduto = (produto: Produto) => {
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
  };

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
    setObservacao('');
  };

  // Finalizar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione itens ao carrinho' });
      return;
    }

    if (!formaPagamento) {
      toast({ variant: 'destructive', title: 'Selecione a forma de pagamento' });
      return;
    }

    setProcessando(true);
    try {
      const pedido = {
        id: `pedido-${Date.now()}`,
        tenantId: '',
        numero: Date.now().toString().slice(-6),
        nomeCliente: 'Cliente Balcão',
        itens: carrinho.map(item => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco,
          total: item.preco * item.quantidade,
        })),
        subtotal: total,
        total,
        formaPagamento,
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
      setFormaPagamento('');
      setTroco('');
      setObservacao('');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({ variant: 'destructive', title: 'Erro ao finalizar venda' });
    } finally {
      setProcessando(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Calcular troco
  const valorRecebido = parseFloat(troco) || 0;
  const valorTroco = valorRecebido > total ? valorRecebido - total : 0;

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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* HEADER */}
      <header className="bg-white border-b border-blue-100 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            {user?.nome?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{user?.nome}</p>
            <p className="text-xs text-gray-500">Ponto de Venda</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-sm font-bold shadow-sm">
            Balcão
          </Badge>

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

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* COLUNA CENTRAL - PRODUTOS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-blue-100">
          {/* BUSCA - Movida para cima */}
          <div className="p-4 border-b border-blue-100 bg-white shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border border-blue-200 focus:border-blue-500 rounded-lg font-semibold h-12 text-lg"
                autoFocus
              />
            </div>
          </div>

          {/* CATEGORIAS - Com wrap para não atrapalhar */}
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 shrink-0">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={categoriaAtiva === 'todos' ? 'default' : 'outline'}
                className={`font-bold whitespace-nowrap transition-all h-10 px-4 ${categoriaAtiva === 'todos' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}
                onClick={() => setCategoriaAtiva('todos')}
              >
                Todos
              </Button>
              {categorias.map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={categoriaAtiva === cat.id ? 'default' : 'outline'}
                  style={categoriaAtiva === cat.id ? { backgroundColor: cat.cor || '#3B82F6', color: 'white' } : { borderColor: cat.cor || '#3B82F6', color: cat.cor || '#3B82F6' }}
                  className={`font-bold whitespace-nowrap transition-all h-10 px-4 ${categoriaAtiva === cat.id ? 'shadow-md' : 'bg-white hover:shadow-md'}`}
                  onClick={() => setCategoriaAtiva(cat.id)}
                >
                  {cat.nome}
                </Button>
              ))}
            </div>
          </div>

          {/* GRID PRODUTOS - Com scroll */}
          <div className="flex-1 overflow-y-auto p-4">
            {produtosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="h-20 w-20 mb-4 opacity-30" />
                <p className="text-lg font-bold">Nenhum produto encontrado</p>
                <p className="text-sm">Cadastre produtos no módulo de administração</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {produtosFiltrados.map(produto => {
                  const categoria = categorias.find(c => c.id === produto.categoriaId);
                  const corCategoria = categoria?.cor || '#3B82F6';
                  return (
                    <button
                      key={produto.id}
                      className="group bg-white rounded-lg p-3 hover:shadow-md active:scale-95 transition-all border border-blue-100 hover:border-blue-300 overflow-hidden relative min-h-[120px]"
                      onClick={() => adicionarProduto(produto)}
                    >
                      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center mb-2 shadow-md transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${corCategoria}25` }}
                        >
                          <Package className="h-6 w-6" style={{ color: corCategoria }} />
                        </div>
                        <p className="text-xs font-bold line-clamp-2 text-gray-800 group-hover:text-blue-600 mb-1">{produto.nome}</p>
                        <p className="text-sm font-extrabold text-green-600">
                          R$ {(produto.precoVenda || 0).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA - CARRINHO */}
        <div className="w-80 lg:w-96 bg-white rounded-lg shadow-sm border border-blue-100 flex flex-col overflow-hidden h-full">
          {/* HEADER CARRINHO */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-700">Carrinho</span>
            </div>
            <Badge className="bg-blue-600 text-white font-bold">{carrinho.length} itens</Badge>
          </div>

          {/* ITENS DO CARRINHO */}
          <ScrollArea className="flex-1 p-3">
            {carrinho.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">Carrinho vazio</p>
                <p className="text-sm">Adicione produtos clicando neles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {carrinho.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{item.nome}</p>
                        <p className="text-green-600 font-bold">R$ {item.preco.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                        onClick={() => removerItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => alterarQuantidade(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantidade}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => alterarQuantidade(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-bold text-blue-600">
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* RODAPÉ DO CARRINHO */}
          <div className="border-t border-blue-100 p-4 bg-gray-50 space-y-3">
            {/* Observação */}
            <Textarea
              placeholder="Observação do pedido..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="h-16 text-sm resize-none"
            />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="text-3xl font-extrabold text-green-600">
                R$ {total.toFixed(2)}
              </span>
            </div>

            {/* Botões */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-12 font-bold"
                onClick={limparCarrinho}
                disabled={carrinho.length === 0}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button
                className="h-12 font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={() => setDialogPagamento(true)}
                disabled={carrinho.length === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
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
              Total: R$ {total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={formaPagamento === 'dinheiro' ? 'default' : 'outline'}
                  className={formaPagamento === 'dinheiro' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setFormaPagamento('dinheiro')}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Dinheiro
                </Button>
                <Button
                  variant={formaPagamento === 'pix' ? 'default' : 'outline'}
                  className={formaPagamento === 'pix' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  onClick={() => setFormaPagamento('pix')}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  PIX
                </Button>
                <Button
                  variant={formaPagamento === 'credito' ? 'default' : 'outline'}
                  className={formaPagamento === 'credito' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                  onClick={() => setFormaPagamento('credito')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Crédito
                </Button>
                <Button
                  variant={formaPagamento === 'debito' ? 'default' : 'outline'}
                  className={formaPagamento === 'debito' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  onClick={() => setFormaPagamento('debito')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Débito
                </Button>
              </div>
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="space-y-2">
                <Label htmlFor="troco">Valor Recebido</Label>
                <Input
                  id="troco"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                />
                {valorTroco > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">Troco: <span className="font-bold">R$ {valorTroco.toFixed(2)}</span></p>
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
              disabled={processando || !formaPagamento}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
