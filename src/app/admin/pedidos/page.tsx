'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Pedido, NotaFiscal, ItemPedido, Produto } from '@/types';
import {
  FileSpreadsheet,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  AlertTriangle,
  Printer,
  Download,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Package,
  DollarSign,
  Calendar,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PedidosPage() {
  const { tenant, user } = useAuthStore();
  const { pedidos, produtos, clientes, aprovarPedido, cancelarPedido, converterPedidoEmVenda, addNotaFiscal, addPedido } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [converterDialogOpen, setConverterDialogOpen] = useState(false);
  const [nfDialogOpen, setNfDialogOpen] = useState(false);
  const [novoPedidoDialogOpen, setNovoPedidoDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nfGerada, setNfGerada] = useState<NotaFiscal | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const { toast } = useToast();

  // Estados do novo pedido
  const [novoPedido, setNovoPedido] = useState<{
    clienteId: string;
    condicaoPagamento: string;
    formaPagamento: string;
    prazoEntrega: string;
    observacoes: string;
    itens: Array<{
      produtoId: string;
      quantidade: number;
      precoUnitario: number;
      desconto: number;
    }>;
  }>({
    clienteId: '',
    condicaoPagamento: '',
    formaPagamento: '',
    prazoEntrega: '',
    observacoes: '',
    itens: []
  });

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const matchSearch = pedido.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.numero.toString().includes(searchTerm);
      const matchStatus = statusFilter === 'todos' || pedido.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pedidos, searchTerm, statusFilter]);

  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
  const pedidosAprovados = pedidos.filter(p => p.status === 'aprovado');
  const totalPedidosPendentes = pedidosPendentes.reduce((acc, p) => acc + p.total, 0);

  // Calcular total do novo pedido
  const calcularTotalNovoPedido = () => {
    const subtotal = novoPedido.itens.reduce((acc, item) => {
      const total = (item.precoUnitario * item.quantidade) - item.desconto;
      return acc + total;
    }, 0);
    const descontos = novoPedido.itens.reduce((acc, item) => acc + item.desconto, 0);
    return { subtotal, total: subtotal };
  };

  // Adicionar item ao pedido
  const adicionarItem = () => {
    setNovoPedido({
      ...novoPedido,
      itens: [...novoPedido.itens, {
        produtoId: '',
        quantidade: 1,
        precoUnitario: 0,
        desconto: 0
      }]
    });
  };

  // Remover item do pedido
  const removerItem = (index: number) => {
    setNovoPedido({
      ...novoPedido,
      itens: novoPedido.itens.filter((_, i) => i !== index)
    });
  };

  // Atualizar item do pedido
  const atualizarItem = (index: number, campo: string, valor: any) => {
    const novosItens = [...novoPedido.itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Se selecionou produto, preencher preço
    if (campo === 'produtoId') {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        novosItens[index].precoUnitario = produto.precoVenda;
      }
    }
    
    setNovoPedido({ ...novoPedido, itens: novosItens });
  };

  // Salvar novo pedido
  const handleSalvarNovoPedido = async () => {
    if (!novoPedido.clienteId) {
      toast({ variant: 'destructive', title: 'Selecione um cliente' });
      return;
    }
    if (novoPedido.itens.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione pelo menos um item' });
      return;
    }
    if (!novoPedido.formaPagamento) {
      toast({ variant: 'destructive', title: 'Selecione a forma de pagamento' });
      return;
    }

    setSaving(true);
    try {
      const cliente = clientes.find(c => c.id === novoPedido.clienteId);
      const { total } = calcularTotalNovoPedido();

      const pedido: Pedido = {
        id: `ped-${Date.now()}`,
        tenantId: tenant?.id || '',
        numero: Math.max(...pedidos.map(p => p.numero), 0) + 1,
        clienteId: novoPedido.clienteId,
        nomeCliente: cliente?.nome || 'Cliente',
        itens: novoPedido.itens.map((item, idx) => {
          const produto = produtos.find(p => p.id === item.produtoId);
          return {
            produtoId: item.produtoId,
            produto: produto,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            desconto: item.desconto,
            total: (item.precoUnitario * item.quantidade) - item.desconto
          };
        }),
        subtotal: total,
        desconto: novoPedido.itens.reduce((acc, item) => acc + item.desconto, 0),
        total: total,
        status: 'pendente',
        condicaoPagamento: novoPedido.condicaoPagamento || 'À vista',
        formaPagamento: novoPedido.formaPagamento,
        prazoEntrega: novoPedido.prazoEntrega ? new Date(novoPedido.prazoEntrega) : undefined,
        observacoes: novoPedido.observacoes,
        dataCriacao: new Date(),
        criadoPor: user?.id || ''
      };

      await addPedido(pedido);

      toast({
        title: 'Pedido criado!',
        description: `Pedido #${pedido.numero} criado com sucesso.`,
      });

      setNovoPedidoDialogOpen(false);
      setNovoPedido({
        clienteId: '',
        condicaoPagamento: '',
        formaPagamento: '',
        prazoEntrega: '',
        observacoes: '',
        itens: []
      });

    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({ variant: 'destructive', title: 'Erro ao criar pedido' });
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async (id: string) => {
    try {
      await aprovarPedido(id);
      toast({ title: 'Pedido aprovado!', description: 'O pedido foi aprovado com sucesso.' });
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível aprovar o pedido.' });
    }
  };

  const handleCancelar = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await cancelarPedido(id);
        toast({ title: 'Pedido cancelado!', description: 'O pedido foi cancelado com sucesso.' });
      } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível cancelar o pedido.' });
      }
    }
  };

  const handleConverter = async () => {
    if (!selectedPedido || !formaPagamento) return;
    setSaving(true);
    try {
      await converterPedidoEmVenda(selectedPedido.id, formaPagamento);
      
      const cliente = clientes.find(c => c.id === selectedPedido.clienteId);
      const nf: NotaFiscal = {
        id: `nf-${Date.now()}`,
        tenantId: tenant?.id || '',
        numero: String(1000 + Math.floor(Math.random() * 1000)),
        serie: '1',
        chave: Array(44).fill(0).map(() => Math.floor(Math.random() * 10)).join(''),
        tipo: 'saida',
        modelo: 'NF-e',
        emitente: {
          nome: tenant?.nome || 'Empresa',
          cnpj: tenant?.cnpj || '',
          ie: '',
          endereco: tenant?.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        },
        destinatario: {
          nome: cliente?.nome || selectedPedido.nomeCliente || 'Cliente',
          cnpj: cliente?.cpfCnpj || '',
          ie: cliente?.inscricaoEstadual || '',
          endereco: cliente?.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        },
        valorTotal: selectedPedido.total,
        valorProdutos: selectedPedido.subtotal,
        valorICMS: selectedPedido.total * 0.18,
        valorPIS: selectedPedido.total * 0.0065,
        valorCOFINS: selectedPedido.total * 0.03,
        dataEmissao: new Date(),
        xmlUrl: '',
        status: 'autorizada',
        produtos: selectedPedido.itens.map(item => {
          const produto = produtos.find(p => p.id === item.produtoId);
          return {
            codigo: produto?.codigo || item.produtoId,
            nome: produto?.nome || 'Produto',
            ncm: produto?.ncm || '00000000',
            cfop: produto?.cfop || '5102',
            cst: produto?.cst || '000',
            unidade: produto?.unidade || 'UN',
            quantidade: item.quantidade,
            valorUnitario: item.precoUnitario,
            valorTotal: item.total
          };
        })
      };
      
      await addNotaFiscal(nf);
      setNfGerada(nf);
      setConverterDialogOpen(false);
      setNfDialogOpen(true);
      
      toast({ title: 'Venda gerada e NFe emitida!', description: 'O pedido foi convertido em venda com sucesso.' });
      setSelectedPedido(null);
    } catch (error) {
      console.error('Erro ao converter pedido:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível converter o pedido em venda.' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'convertido':
        return <Badge className="bg-green-500"><ArrowRight className="h-3 w-3 mr-1" />Convertido</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout breadcrumbs={[{ title: 'Admin' }, { title: 'Pedidos' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pedidos</h1>
            <p className="text-muted-foreground">Gerencie orçamentos e pré-vendas</p>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            onClick={() => setNovoPedidoDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{pedidos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pedidosPendentes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold">{pedidosAprovados.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-2xl font-bold">
                    R$ {totalPedidosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="convertido">Convertidos</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
            <CardDescription>{filteredPedidos.length} pedido(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPedidos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-mono font-semibold">#{pedido.numero}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pedido.nomeCliente || 'Cliente não informado'}</p>
                            <p className="text-xs text-muted-foreground">{pedido.condicaoPagamento}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{pedido.itens.length}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{new Date(pedido.dataCriacao).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedPedido(pedido); setDialogOpen(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pedido.status === 'pendente' && (
                              <>
                                <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleAprovar(pedido.id)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancelar(pedido.id)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {pedido.status === 'aprovado' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { setSelectedPedido(pedido); setFormaPagamento(''); setConverterDialogOpen(true); }}>
                                <FileText className="h-4 w-4 mr-1" />
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Novo Pedido */}
      <Dialog open={novoPedidoDialogOpen} onOpenChange={setNovoPedidoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Novo Pedido
            </DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo pedido</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Cliente e Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={novoPedido.clienteId} onValueChange={(value) => setNovoPedido({ ...novoPedido, clienteId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condição de Pagamento</Label>
                  <Select value={novoPedido.condicaoPagamento} onValueChange={(value) => setNovoPedido({ ...novoPedido, condicaoPagamento: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="7 dias">7 dias</SelectItem>
                      <SelectItem value="14 dias">14 dias</SelectItem>
                      <SelectItem value="30 dias">30 dias</SelectItem>
                      <SelectItem value="30/60 dias">30/60 dias</SelectItem>
                      <SelectItem value="30/60/90 dias">30/60/90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento *</Label>
                  <Select value={novoPedido.formaPagamento} onValueChange={(value) => setNovoPedido({ ...novoPedido, formaPagamento: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo de Entrega</Label>
                  <Input
                    type="date"
                    value={novoPedido.prazoEntrega}
                    onChange={(e) => setNovoPedido({ ...novoPedido, prazoEntrega: e.target.value })}
                  />
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itens do Pedido</Label>
                  <Button type="button" variant="outline" size="sm" onClick={adicionarItem} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>

                {novoPedido.itens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-24">Qtd</TableHead>
                          <TableHead className="w-32">Preço Unit.</TableHead>
                          <TableHead className="w-28">Desconto</TableHead>
                          <TableHead className="w-32">Total</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {novoPedido.itens.map((item, index) => {
                          const produto = produtos.find(p => p.id === item.produtoId);
                          const totalItem = (item.precoUnitario * item.quantidade) - item.desconto;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Select value={item.produtoId} onValueChange={(value) => atualizarItem(index, 'produtoId', value)}>
                                  <SelectTrigger className="w-full min-w-[200px]">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {produtos.filter(p => p.ativo).map(p => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.codigo} - {p.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {produto && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    NCM: {produto.ncm} | Estoque: {produto.estoqueAtual}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.precoUnitario}
                                  onChange={(e) => atualizarItem(index, 'precoUnitario', parseFloat(e.target.value) || 0)}
                                  className="w-28"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.desconto}
                                  onChange={(e) => atualizarItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell className="font-semibold">
                                R$ {totalItem.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removerItem(index)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Totais */}
                {novoPedido.itens.length > 0 && (
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>R$ {calcularTotalNovoPedido().subtotal.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-green-600">R$ {calcularTotalNovoPedido().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none"
                  placeholder="Observações do pedido..."
                  value={novoPedido.observacoes}
                  onChange={(e) => setNovoPedido({ ...novoPedido, observacoes: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoPedidoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovoPedido} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedPedido?.numero}</DialogTitle>
            <DialogDescription>Detalhes do pedido</DialogDescription>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{selectedPedido.nomeCliente || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Condição de Pagamento</Label>
                  <p className="font-medium">{selectedPedido.condicaoPagamento}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Forma de Pagamento</Label>
                  <p className="font-medium">{selectedPedido.formaPagamento || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Criação</Label>
                  <p className="font-medium">{new Date(selectedPedido.dataCriacao).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPedido.itens.map((item, idx) => {
                      const produto = produtos.find(p => p.id === item.produtoId);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <p>{produto?.nome || item.produtoId}</p>
                            {produto?.ncm && <p className="text-xs text-muted-foreground">NCM: {produto.ncm}</p>}
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">R$ {item.precoUnitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">R$ {item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total do Pedido:</span>
                <span className="text-2xl font-bold">R$ {selectedPedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {selectedPedido.observacoes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p>{selectedPedido.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Converter em Venda */}
      <Dialog open={converterDialogOpen} onOpenChange={setConverterDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Converter em Venda e Emitir NFe</DialogTitle>
            <DialogDescription>Revise os dados e confirme para emitir a Nota Fiscal</DialogDescription>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Revise os dados antes de emitir</p>
                    <p className="text-sm text-blue-700">Verifique se todos os dados estão corretos antes de converter em venda.</p>
                  </div>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome</Label>
                      <p className="font-medium">{selectedPedido.nomeCliente || 'Cliente não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Condição</Label>
                      <p className="font-medium">{selectedPedido.condicaoPagamento}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPedido.itens.map((item, idx) => {
                        const produto = produtos.find(p => p.id === item.produtoId);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{produto?.nome || 'Produto'}</p>
                                <p className="text-xs text-muted-foreground">NCM: {produto?.ncm || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-right">R$ {item.precoUnitario.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">R$ {item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold">R$ {selectedPedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConverterDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleConverter} disabled={saving || !formaPagamento} className="bg-green-600 hover:bg-green-700">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Confirmar e Emitir NFe
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog NFe Gerada */}
      <Dialog open={nfDialogOpen} onOpenChange={setNfDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <DialogTitle>NFe Emitida com Sucesso!</DialogTitle>
            </div>
            <DialogDescription>A Nota Fiscal foi gerada e autorizada</DialogDescription>
          </DialogHeader>
          {nfGerada && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Número da NFe</Label>
                    <p className="font-mono font-bold text-lg">{nfGerada.numero}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Série</Label>
                    <p className="font-bold">{nfGerada.serie}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-muted-foreground text-xs">Chave de Acesso</Label>
                  <p className="font-mono text-sm break-all">{nfGerada.chave}</p>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumo da NFe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Destinatário</Label>
                      <p className="font-medium">{nfGerada.destinatario.nome}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Valor Total</Label>
                      <p className="font-bold text-lg">R$ {nfGerada.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Autorizada
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Emitida em {new Date(nfGerada.dataEmissao).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNfDialogOpen(false)}>Fechar</Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
