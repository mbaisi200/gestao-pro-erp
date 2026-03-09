'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { MovimentacaoEstoque, Produto } from '@/types';
import {
  Warehouse,
  Search,
  Loader2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  List,
  PackageOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interface para movimentação no estado local
interface MovimentacaoLocal {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  estoqueAnterior: number;
  estoqueAtual: number;
  motivo: string;
  documentoRef?: string;
  data: Date;
  usuarioId: string;
  usuario: string;
}

export default function EstoquePage() {
  const { tenant, user } = useAuthStore();
  const { produtos, categorias, movimentarEstoque } = useAppStore();
  
  // Estados
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMovTerm, setSearchMovTerm] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'baixo' | 'zerado' | 'normal'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroTipoMov, setFiltroTipoMov] = useState<'todos' | 'entrada' | 'saida' | 'ajuste'>('todos');
  const { toast } = useToast();

  // Movimentações locais (em produção viria do banco)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoLocal[]>(() => {
    // Inicializar com algumas movimentações de exemplo
    const movs: MovimentacaoLocal[] = [];
    produtos.slice(0, 5).forEach((p, idx) => {
      if (p.estoqueAtual > 0) {
        movs.push({
          id: `mov-${idx}-1`,
          produtoId: p.id,
          produtoNome: p.nome,
          tipo: 'entrada',
          quantidade: p.estoqueAtual + Math.floor(Math.random() * 10),
          estoqueAnterior: 0,
          estoqueAtual: p.estoqueAtual,
          motivo: 'Estoque inicial',
          documentoRef: '',
          data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          usuarioId: 'user-001',
          usuario: 'João Silva'
        });
      }
    });
    return movs;
  });

  const produtosEstoque = useMemo(() => {
    let filtered = produtos.filter(p => p.tipo === 'produto');
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filtroCategoria !== 'todas') {
      filtered = filtered.filter(p => p.categoriaId === filtroCategoria);
    }
    if (filtroEstoque === 'baixo') {
      filtered = filtered.filter(p => p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0);
    } else if (filtroEstoque === 'zerado') {
      filtered = filtered.filter(p => p.estoqueAtual === 0);
    } else if (filtroEstoque === 'normal') {
      filtered = filtered.filter(p => p.estoqueAtual > p.estoqueMinimo);
    }
    return filtered;
  }, [produtos, searchTerm, filtroEstoque, filtroCategoria]);

  const movimentacoesFiltradas = useMemo(() => {
    let filtered = [...movimentacoes].sort((a, b) => b.data.getTime() - a.data.getTime());
    if (searchMovTerm) {
      filtered = filtered.filter(m =>
        m.produtoNome.toLowerCase().includes(searchMovTerm.toLowerCase()) ||
        m.motivo.toLowerCase().includes(searchMovTerm.toLowerCase())
      );
    }
    if (filtroTipoMov !== 'todos') {
      filtered = filtered.filter(m => m.tipo === filtroTipoMov);
    }
    return filtered;
  }, [movimentacoes, searchMovTerm, filtroTipoMov]);

  const produtosEstoqueBaixo = produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0);
  const produtosEstoqueZerado = produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual === 0);
  const produtosEstoqueNormal = produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual > p.estoqueMinimo);
  const valorTotalEstoque = produtos.filter(p => p.tipo === 'produto').reduce((acc, p) => acc + (p.estoqueAtual * p.precoCusto), 0);

  const handleMovimentacao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduto) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const quantidade = parseFloat(formData.get('quantidade') as string);
    const motivo = formData.get('motivo') as string;
    const documentoRef = formData.get('documentoRef') as string;

    try {
      const produto = produtos.find(p => p.id === selectedProduto);
      if (!produto) throw new Error('Produto não encontrado');

      const estoqueAnterior = produto.estoqueAtual;
      
      // Chamar a função do store
      movimentarEstoque(selectedProduto, tipoMovimentacao, quantidade, motivo);
      
      // Adicionar à lista de movimentações
      const novaMovimentacao: MovimentacaoLocal = {
        id: `mov-${Date.now()}`,
        produtoId: selectedProduto,
        produtoNome: produto.nome,
        tipo: tipoMovimentacao,
        quantidade,
        estoqueAnterior,
        estoqueAtual: tipoMovimentacao === 'entrada' ? estoqueAnterior + quantidade :
                     tipoMovimentacao === 'saida' ? estoqueAnterior - quantidade : quantidade,
        motivo,
        documentoRef,
        data: new Date(),
        usuarioId: user?.id || 'user-001',
        usuario: user?.nome || 'Usuário'
      };
      
      setMovimentacoes(prev => [novaMovimentacao, ...prev]);
      
      toast({ title: 'Movimentação registrada!', description: `Estoque de ${produto.nome} atualizado.` });
      setDialogOpen(false);
      setSelectedProduto(null);
    } catch (error) {
      console.error('Erro ao movimentar estoque:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar a movimentação.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirMovimentacao = (movId: string) => {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      setMovimentacoes(prev => prev.filter(m => m.id !== movId));
      toast({ title: 'Movimentação excluída!' });
    }
  };

  const openMovimentacaoDialog = (produtoId: string, tipo: 'entrada' | 'saida' | 'ajuste') => {
    setSelectedProduto(produtoId);
    setTipoMovimentacao(tipo);
    setDialogOpen(true);
  };

  const openNovaMovimentacaoDialog = () => {
    setSelectedProduto(null);
    setTipoMovimentacao('entrada');
    setDialogOpen(true);
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroEstoque('todos');
    setFiltroCategoria('todas');
  };

  const temFiltrosAtivos = searchTerm !== '' || filtroEstoque !== 'todos' || filtroCategoria !== 'todas';

  return (
    <MainLayout breadcrumbs={[{ title: 'Admin' }, { title: 'Controle de Estoque' }]}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Controle de Estoque</h1>
            <p className="text-xs text-muted-foreground">Gerencie o estoque e movimentações</p>
          </div>
          <Button size="sm" onClick={openNovaMovimentacaoDialog}>
            <Plus className="mr-1 h-4 w-4" />Nova Movimentação
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-2 grid-cols-4">
          {[
            { label: 'Produtos', value: produtos.filter(p => p.tipo === 'produto').length, icon: Package, color: 'blue' },
            { label: 'Normal', value: produtosEstoqueNormal.length, icon: TrendingUp, color: 'green' },
            { label: 'Baixo', value: produtosEstoqueBaixo.length, icon: AlertTriangle, color: 'orange' },
            { label: 'Zerado', value: produtosEstoqueZerado.length, icon: TrendingDown, color: 'red' }
          ].map((s, i) => (
            <div key={i} className={`bg-${s.color}-50 border border-${s.color}-100 rounded p-2 flex items-center gap-2`}>
              <s.icon className={`h-4 w-4 text-${s.color}-600`} />
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alerta */}
        {produtosEstoqueBaixo.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 text-sm">{produtosEstoqueBaixo.length} produtos com estoque baixo</p>
                <p className="text-xs text-orange-700">Verifique e faça reposição.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="produtos" className="space-y-3">
          <TabsList className="h-8">
            <TabsTrigger value="produtos" className="text-xs px-3"><Package className="h-3 w-3 mr-1" />Produtos</TabsTrigger>
            <TabsTrigger value="movimentacoes" className="text-xs px-3"><List className="h-3 w-3 mr-1" />Movimentações ({movimentacoes.length})</TabsTrigger>
          </TabsList>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="space-y-3">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-sm" />
              </div>
              <Select value={filtroEstoque} onValueChange={(v) => setFiltroEstoque(v as any)}>
                <SelectTrigger className="w-full md:w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="zerado">Zerado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-full md:w-[160px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 h-7">
                      <TableHead className="text-[10px] h-7">Cód.</TableHead>
                      <TableHead className="text-[10px] h-7">Nome</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Atual</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Mín.</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Custo</TableHead>
                      <TableHead className="text-[10px] h-7">Status</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosEstoque.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">Nenhum produto</TableCell></TableRow>
                    ) : produtosEstoque.map((produto) => {
                      const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo;
                      const zerado = produto.estoqueAtual === 0;
                      return (
                        <TableRow key={produto.id} className="h-7">
                          <TableCell className="font-mono text-xs">{produto.codigo}</TableCell>
                          <TableCell className="text-xs font-medium truncate max-w-[150px]">{produto.nome}</TableCell>
                          <TableCell className={`text-right text-xs font-semibold ${zerado ? 'text-red-600' : estoqueBaixo ? 'text-orange-600' : ''}`}>
                            {produto.estoqueAtual} {produto.unidade}
                          </TableCell>
                          <TableCell className="text-right text-xs">{produto.estoqueMinimo} {produto.unidade}</TableCell>
                          <TableCell className="text-right text-xs">R$ {produto.precoCusto.toFixed(2)}</TableCell>
                          <TableCell>
                            {zerado ? <Badge className="bg-red-500 text-[10px] px-1">Zerado</Badge> :
                             estoqueBaixo ? <Badge className="bg-orange-500 text-[10px] px-1">Baixo</Badge> :
                             <Badge className="bg-green-500 text-[10px] px-1">Normal</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-0.5">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-600" onClick={() => openMovimentacaoDialog(produto.id, 'entrada')} title="Entrada"><ArrowUpCircle className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={() => openMovimentacaoDialog(produto.id, 'saida')} disabled={produto.estoqueAtual === 0} title="Saída"><ArrowDownCircle className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Valor Total do Estoque</p>
                  <p className="text-sm font-bold">R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Baseado no preço de custo</p>
            </div>
          </TabsContent>

          {/* Tab Movimentações */}
          <TabsContent value="movimentacoes" className="space-y-3">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Buscar movimentações..." value={searchMovTerm} onChange={(e) => setSearchMovTerm(e.target.value)} className="pl-7 h-8 text-sm" />
              </div>
              <Select value={filtroTipoMov} onValueChange={(v) => setFiltroTipoMov(v as any)}>
                <SelectTrigger className="w-full md:w-[140px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={openNovaMovimentacaoDialog}><Plus className="mr-1 h-3 w-3" />Nova</Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 h-7">
                      <TableHead className="text-[10px] h-7">Data</TableHead>
                      <TableHead className="text-[10px] h-7">Produto</TableHead>
                      <TableHead className="text-[10px] h-7">Tipo</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Qtd</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Anterior</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Atual</TableHead>
                      <TableHead className="text-[10px] h-7">Motivo</TableHead>
                      <TableHead className="text-[10px] h-7 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoesFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                          <PackageOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma movimentação registrada
                        </TableCell>
                      </TableRow>
                    ) : movimentacoesFiltradas.map((mov) => (
                      <TableRow key={mov.id} className="h-7">
                        <TableCell className="text-xs">{new Date(mov.data).toLocaleDateString('pt-BR')} {new Date(mov.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell className="text-xs font-medium truncate max-w-[120px]">{mov.produtoNome}</TableCell>
                        <TableCell>
                          {mov.tipo === 'entrada' ? <Badge className="bg-green-500 text-[10px] px-1"><ArrowUpCircle className="h-3 w-3 mr-0.5" />Entrada</Badge> :
                           mov.tipo === 'saida' ? <Badge className="bg-red-500 text-[10px] px-1"><ArrowDownCircle className="h-3 w-3 mr-0.5" />Saída</Badge> :
                           <Badge className="bg-blue-500 text-[10px] px-1"><RefreshCw className="h-3 w-3 mr-0.5" />Ajuste</Badge>}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">{mov.tipo === 'saida' ? '-' : '+'}{mov.quantidade}</TableCell>
                        <TableCell className="text-right text-xs">{mov.estoqueAnterior}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{mov.estoqueAtual}</TableCell>
                        <TableCell className="text-xs truncate max-w-[100px]">{mov.motivo}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Editar"><Edit className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={() => handleExcluirMovimentacao(mov.id)} title="Excluir"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {tipoMovimentacao === 'entrada' ? 'Entrada de Estoque' : tipoMovimentacao === 'saida' ? 'Saída de Estoque' : 'Ajuste de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMovimentacao}>
            <div className="space-y-3 py-2">
              {!selectedProduto && (
                <div className="space-y-1">
                  <Label className="text-xs">Produto *</Label>
                  <Select onValueChange={(v) => setSelectedProduto(v)} required>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.filter(p => p.tipo === 'produto').map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome} (Est: {p.estoqueAtual})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo *</Label>
                  <Select value={tipoMovimentacao} onValueChange={(v) => setTipoMovimentacao(v as any)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade *</Label>
                  <Input name="quantidade" type="number" step="0.01" placeholder="0" required className="h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Motivo *</Label>
                <Input name="motivo" placeholder="Ex: Compra, Venda, Ajuste..." required className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Documento (opcional)</Label>
                <Input name="documentoRef" placeholder="Ex: NF 12345" className="h-8" />
              </div>
            </div>
            <DialogFooter className="mt-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={saving} className={tipoMovimentacao === 'entrada' ? 'bg-green-600 hover:bg-green-700' : tipoMovimentacao === 'saida' ? 'bg-red-600 hover:bg-red-700' : ''}>
                {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
