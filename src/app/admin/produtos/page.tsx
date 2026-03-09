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
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Produto, TipoItem } from '@/types';
import {
  Package,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Tags,
  Wrench,
  AlertTriangle,
  DollarSign,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProdutosPage() {
  const { tenant } = useAuthStore();
  const { produtos, categorias, addProduto, updateProduto, deleteProduto } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoItem | 'todos'>('todos');
  const [tipoCadastro, setTipoCadastro] = useState<TipoItem>('produto');
  const { toast } = useToast();

  const filteredProdutos = useMemo(() => {
    return produtos.filter(produto => {
      const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (produto.codigoBarras && produto.codigoBarras.includes(searchTerm));
      const matchTipo = tipoFilter === 'todos' || produto.tipo === tipoFilter;
      return matchSearch && matchTipo;
    });
  }, [produtos, searchTerm, tipoFilter]);

  const produtosEstoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo && p.tipo === 'produto');

  const openNewProdutoDialog = () => {
    setEditingProduto(null);
    setTipoCadastro('produto');
    setDialogOpen(true);
  };

  const openNewServicoDialog = () => {
    setEditingProduto(null);
    setTipoCadastro('servico');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const tipo = (formData.get('tipo') as TipoItem) || tipoCadastro;
      
      const produtoData: Produto = {
        id: editingProduto?.id || `prod-${Date.now()}`,
        tenantId: tenant?.id || '',
        codigo: formData.get('codigo') as string,
        codigoBarras: tipo === 'produto' ? (formData.get('codigoBarras') as string || undefined) : undefined,
        nome: formData.get('nome') as string,
        descricao: formData.get('descricao') as string || '',
        tipo,
        categoriaId: formData.get('categoriaId') as string,
        ncm: tipo === 'produto' ? (formData.get('ncm') as string || '') : '',
        cst: tipo === 'produto' ? (formData.get('cst') as string || '000') : '000',
        cfop: tipo === 'produto' ? (formData.get('cfop') as string || '5102') : '5933',
        icms: tipo === 'produto' ? (parseFloat(formData.get('icms') as string) || 0) : 0,
        pis: parseFloat(formData.get('pis') as string) || 0,
        cofins: parseFloat(formData.get('cofins') as string) || 0,
        unidade: formData.get('unidade') as string || (tipo === 'servico' ? 'HR' : 'UN'),
        precoCusto: tipo === 'produto' ? (parseFloat(formData.get('precoCusto') as string) || 0) : 0,
        precoVenda: parseFloat(formData.get('precoVenda') as string) || 0,
        estoqueAtual: tipo === 'produto' ? (parseFloat(formData.get('estoqueAtual') as string) || 0) : 0,
        estoqueMinimo: tipo === 'produto' ? (parseFloat(formData.get('estoqueMinimo') as string) || 0) : 0,
        atalhoPDV: formData.get('atalhoPDV') === 'on',
        ativo: true,
        dataCriacao: editingProduto?.dataCriacao || new Date(),
        dataAtualizacao: new Date(),
      };

      if (editingProduto) {
        await updateProduto(editingProduto.id, produtoData);
        toast({
          title: `${tipo === 'produto' ? 'Produto' : 'Serviço'} atualizado!`,
          description: `Os dados foram atualizados com sucesso.`,
        });
      } else {
        await addProduto(produtoData);
        toast({
          title: `${tipo === 'produto' ? 'Produto' : 'Serviço'} cadastrado!`,
          description: `O novo ${tipo === 'produto' ? 'produto' : 'serviço'} foi adicionado com sucesso.`,
        });
      }

      setDialogOpen(false);
      setEditingProduto(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setTipoCadastro(produto.tipo);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteProduto(id);
        toast({
          title: 'Item excluído!',
          description: 'O item foi removido com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir.',
        });
      }
    }
  };

  const isProduto = tipoCadastro === 'produto' || editingProduto?.tipo === 'produto';

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Produtos e Serviços' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produtos e Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de produtos e serviços
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              onClick={openNewProdutoDialog}
            >
              <Package className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
            <Button 
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={openNewServicoDialog}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </div>
        </div>

        {/* Dialog de Cadastro */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProduto(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduto 
                  ? `Editar ${editingProduto.tipo === 'produto' ? 'Produto' : 'Serviço'}`
                  : `Cadastrar ${tipoCadastro === 'produto' ? 'Produto' : 'Serviço'}`
                }
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do {tipoCadastro === 'produto' ? 'produto' : 'serviço'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave}>
              <div className="grid gap-4 py-4">
                <input type="hidden" name="tipo" value={tipoCadastro} />
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" placeholder="001" defaultValue={editingProduto?.codigo} required />
                  </div>
                  {isProduto && (
                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="codigoBarras">Código de Barras</Label>
                      <Input id="codigoBarras" name="codigoBarras" placeholder="EAN/GTIN" defaultValue={editingProduto?.codigoBarras} />
                    </div>
                  )}
                  {!isProduto && (
                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Select name="unidade" defaultValue={editingProduto?.unidade || 'HR'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HR">HR - Hora</SelectItem>
                          <SelectItem value="UN">UN - Unidade</SelectItem>
                          <SelectItem value="MT">MT - Metro</SelectItem>
                          <SelectItem value="M2">M² - Metro Quadrado</SelectItem>
                          <SelectItem value="KG">KG - Quilograma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" name="nome" placeholder={`Nome do ${isProduto ? 'produto' : 'serviço'}`} defaultValue={editingProduto?.nome} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" name="descricao" placeholder="Descrição detalhada" defaultValue={editingProduto?.descricao} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoriaId">Categoria</Label>
                    <Select name="categoriaId" defaultValue={editingProduto?.categoriaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isProduto && (
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Select name="unidade" defaultValue={editingProduto?.unidade || 'UN'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UN">UN - Unidade</SelectItem>
                          <SelectItem value="CX">CX - Caixa</SelectItem>
                          <SelectItem value="PC">PC - Peça</SelectItem>
                          <SelectItem value="KG">KG - Quilograma</SelectItem>
                          <SelectItem value="LT">LT - Litro</SelectItem>
                          <SelectItem value="MT">MT - Metro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {isProduto && (
                    <div className="space-y-2">
                      <Label htmlFor="precoCusto">Preço de Custo (R$)</Label>
                      <Input id="precoCusto" name="precoCusto" type="number" step="0.01" placeholder="0,00" defaultValue={editingProduto?.precoCusto} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="precoVenda">Preço de Venda (R$) *</Label>
                    <Input id="precoVenda" name="precoVenda" type="number" step="0.01" placeholder="0,00" defaultValue={editingProduto?.precoVenda} required />
                  </div>
                </div>

                {/* Campos específicos de Serviço */}
                {!isProduto && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Informações do Serviço
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tempoEstimado">Tempo Estimado</Label>
                        <Input id="tempoEstimado" name="tempoEstimado" placeholder="Ex: 2 horas" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="garantia">Garantia (dias)</Label>
                        <Input id="garantia" name="garantia" type="number" placeholder="90" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos específicos de Produto */}
                {isProduto && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estoqueAtual">Estoque Atual</Label>
                        <Input id="estoqueAtual" name="estoqueAtual" type="number" step="0.01" placeholder="0" defaultValue={editingProduto?.estoqueAtual} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                        <Input id="estoqueMinimo" name="estoqueMinimo" type="number" step="0.01" placeholder="0" defaultValue={editingProduto?.estoqueMinimo} />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Dados Fiscais (NF-e)</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ncm">NCM</Label>
                          <Input id="ncm" name="ncm" placeholder="0000.00.00" defaultValue={editingProduto?.ncm} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cst">CST</Label>
                          <Input id="cst" name="cst" placeholder="000" defaultValue={editingProduto?.cst} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cfop">CFOP</Label>
                          <Input id="cfop" name="cfop" placeholder="5102" defaultValue={editingProduto?.cfop} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="icms">ICMS %</Label>
                          <Input id="icms" name="icms" type="number" step="0.01" placeholder="18" defaultValue={editingProduto?.icms} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="atalhoPDV" name="atalhoPDV" defaultChecked={editingProduto?.atalhoPDV} className="h-4 w-4" />
                  <Label htmlFor="atalhoPDV">Mostrar como atalho no PDV</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
                    Alguns produtos estão abaixo do estoque mínimo definido.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{produtos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Tags className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-2xl font-bold">{produtos.filter(p => p.tipo === 'produto').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serviços</p>
                  <p className="text-2xl font-bold">{produtos.filter(p => p.tipo === 'servico').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold">{produtosEstoqueBaixo.length}</p>
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
                  placeholder="Buscar por nome, código ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoItem | 'todos')}>
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="produto">Produtos</TabsTrigger>
                  <TabsTrigger value="servico">Serviços</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
            <CardDescription>{filteredProdutos.length} item(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProdutos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum item encontrado</p>
                <p className="text-sm">Clique em &quot;Novo Produto&quot; ou &quot;Novo Serviço&quot; para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço Venda</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProdutos.map((produto) => {
                      const categoria = categorias.find(c => c.id === produto.categoriaId);
                      const estoqueBaixo = produto.tipo === 'produto' && produto.estoqueAtual <= produto.estoqueMinimo;
                      return (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <div>
                              <p className="font-mono">{produto.codigo}</p>
                              {produto.codigoBarras && (
                                <p className="text-xs text-muted-foreground">{produto.codigoBarras}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{produto.nome}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{produto.descricao}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={produto.tipo === 'produto' ? 'default' : 'secondary'}>
                              {produto.tipo === 'produto' ? 'Produto' : 'Serviço'}
                            </Badge>
                          </TableCell>
                          <TableCell>{categoria?.nome || '-'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {produto.precoVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {produto.tipo === 'produto' ? (
                              <span className={estoqueBaixo ? 'text-orange-600 font-semibold' : ''}>
                                {produto.estoqueAtual}
                                {estoqueBaixo && ' ⚠'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={produto.ativo ? 'bg-green-500' : 'bg-gray-500'}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(produto)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(produto.id)}>
                                <Trash2 className="h-4 w-4" />
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
    </MainLayout>
  );
}
