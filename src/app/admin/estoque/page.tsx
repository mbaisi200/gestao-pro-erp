'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EstoquePage() {
  const { tenant } = useAuthStore();
  const { produtos, categorias, movimentarEstoque } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'baixo' | 'zerado' | 'normal'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const { toast } = useToast();

  const produtosEstoque = useMemo(() => {
    let filtered = produtos.filter(p => p.tipo === 'produto');

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de categoria
    if (filtroCategoria !== 'todas') {
      filtered = filtered.filter(p => p.categoriaId === filtroCategoria);
    }

    // Filtro de status de estoque
    if (filtroEstoque === 'baixo') {
      filtered = filtered.filter(p => p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0);
    } else if (filtroEstoque === 'zerado') {
      filtered = filtered.filter(p => p.estoqueAtual === 0);
    } else if (filtroEstoque === 'normal') {
      filtered = filtered.filter(p => p.estoqueAtual > p.estoqueMinimo);
    }

    return filtered;
  }, [produtos, searchTerm, filtroEstoque, filtroCategoria]);

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

    try {
      movimentarEstoque(selectedProduto, tipoMovimentacao, quantidade, motivo);
      toast({
        title: 'Movimentação registrada!',
        description: `Estoque atualizado com sucesso.`,
      });
      setDialogOpen(false);
      setSelectedProduto(null);
    } catch (error) {
      console.error('Erro ao movimentar estoque:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a movimentação.',
      });
    } finally {
      setSaving(false);
    }
  };

  const openMovimentacaoDialog = (produtoId: string, tipo: 'entrada' | 'saida' | 'ajuste') => {
    setSelectedProduto(produtoId);
    setTipoMovimentacao(tipo);
    setDialogOpen(true);
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroEstoque('todos');
    setFiltroCategoria('todas');
  };

  const temFiltrosAtivos = searchTerm !== '' || filtroEstoque !== 'todos' || filtroCategoria !== 'todas';

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Controle de Estoque' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Controle de Estoque</h1>
            <p className="text-muted-foreground">
              Gerencie o estoque dos seus produtos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{produtos.filter(p => p.tipo === 'produto').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroEstoque('normal')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Normal</p>
                  <p className="text-2xl font-bold text-green-600">{produtosEstoqueNormal.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroEstoque('baixo')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-orange-600">{produtosEstoqueBaixo.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroEstoque('zerado')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Zerado</p>
                  <p className="text-2xl font-bold text-red-600">{produtosEstoqueZerado.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de estoque baixo */}
        {produtosEstoqueBaixo.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-800">
                    Atenção: {produtosEstoqueBaixo.length} produtos com estoque baixo
                  </p>
                  <p className="text-sm text-orange-700">
                    Verifique os produtos abaixo do estoque mínimo e faça reposição.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
                {temFiltrosAtivos && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros} className="ml-auto">
                    Limpar filtros
                  </Button>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtroEstoque} onValueChange={(v) => setFiltroEstoque(v as any)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status do Estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="baixo">Estoque Baixo</SelectItem>
                    <SelectItem value="zerado">Estoque Zerado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Categorias</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {temFiltrosAtivos && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: &quot;{searchTerm}&quot;
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {filtroEstoque !== 'todos' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {filtroEstoque === 'normal' ? 'Normal' : filtroEstoque === 'baixo' ? 'Baixo' : 'Zerado'}
                      <button onClick={() => setFiltroEstoque('todos')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {filtroCategoria !== 'todas' && (
                    <Badge variant="secondary" className="gap-1">
                      Categoria: {categorias.find(c => c.id === filtroCategoria)?.nome}
                      <button onClick={() => setFiltroCategoria('todas')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Valor Total do Estoque */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
                  <p className="text-2xl font-bold">
                    R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado no preço de custo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Produtos em Estoque</CardTitle>
                <CardDescription>{produtosEstoque.length} produto(s) encontrado(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {produtosEstoque.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto encontrado</p>
                <p className="text-sm">Ajuste os filtros ou cadastre novos produtos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Estoque Atual</TableHead>
                      <TableHead className="text-right">Estoque Mínimo</TableHead>
                      <TableHead className="text-right">Preço Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosEstoque.map((produto) => {
                      const categoria = categorias.find(c => c.id === produto.categoriaId);
                      const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo;
                      const zerado = produto.estoqueAtual === 0;
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-mono">{produto.codigo}</TableCell>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>
                            {categoria && (
                              <Badge variant="outline" style={{ borderColor: categoria.cor, color: categoria.cor }}>
                                {categoria.nome}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${zerado ? 'text-red-600' : estoqueBaixo ? 'text-orange-600' : ''}`}>
                            {produto.estoqueAtual} {produto.unidade}
                          </TableCell>
                          <TableCell className="text-right">{produto.estoqueMinimo} {produto.unidade}</TableCell>
                          <TableCell className="text-right">
                            R$ {produto.precoCusto.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {zerado ? (
                              <Badge className="bg-red-500">Zerado</Badge>
                            ) : estoqueBaixo ? (
                              <Badge className="bg-orange-500">Baixo</Badge>
                            ) : (
                              <Badge className="bg-green-500">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => openMovimentacaoDialog(produto.id, 'entrada')}
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openMovimentacaoDialog(produto.id, 'saida')}
                                disabled={produto.estoqueAtual === 0}
                              >
                                <ArrowDownCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoMovimentacao === 'entrada' ? 'Entrada de Estoque' : tipoMovimentacao === 'saida' ? 'Saída de Estoque' : 'Ajuste de Estoque'}
            </DialogTitle>
            <DialogDescription>
              Registre a movimentação de estoque
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovimentacao}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input
                  id="motivo"
                  name="motivo"
                  placeholder="Ex: Compra de fornecedor, Venda, Ajuste de inventário..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={tipoMovimentacao === 'entrada' ? 'bg-green-600 hover:bg-green-700' : tipoMovimentacao === 'saida' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
