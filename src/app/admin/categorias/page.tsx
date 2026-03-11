'use client';

import React, { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Categoria } from '@/types';
import {
  FolderOpen,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Palette,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const colorOptions = [
  { value: '#3b82f6', name: 'Azul' },
  { value: '#10b981', name: 'Verde' },
  { value: '#f59e0b', name: 'Amarelo' },
  { value: '#ef4444', name: 'Vermelho' },
  { value: '#8b5cf6', name: 'Roxo' },
  { value: '#ec4899', name: 'Rosa' },
  { value: '#06b6d4', name: 'Ciano' },
  { value: '#84cc16', name: 'Lima' },
];

export default function CategoriasPage() {
  const { tenant } = useAuthStore();
  const { categorias, addCategoria, updateCategoria, deleteCategoria } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const nomeCategoria = (formData.get('nome') as string).trim();

    // Verificar se já existe categoria com o mesmo nome (case insensitive)
    const nomeLower = nomeCategoria.toLowerCase();
    const categoriaExistente = categorias.find(
      cat => cat.nome.toLowerCase() === nomeLower && cat.id !== editingCategoria?.id
    );

    if (categoriaExistente) {
      toast({
        variant: 'destructive',
        title: 'Categoria duplicada!',
        description: `Já existe uma categoria com o nome "${categoriaExistente.nome}".`,
      });
      setSaving(false);
      return;
    }

    try {
      const categoriaData: Categoria = {
        id: editingCategoria?.id || `cat-${Date.now()}`,
        tenantId: tenant?.id || '',
        nome: nomeCategoria,
        descricao: formData.get('descricao') as string || '',
        cor: formData.get('cor') as string || '#3b82f6',
        ativa: true,
      };

      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, categoriaData);
        toast({
          title: 'Categoria atualizada!',
          description: 'Os dados da categoria foram atualizados com sucesso.',
        });
      } else {
        await addCategoria(categoriaData);
        toast({
          title: 'Categoria cadastrada!',
          description: 'A nova categoria foi adicionada com sucesso.',
        });
      }

      setDialogOpen(false);
      setEditingCategoria(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar a categoria.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategoria(id);
        toast({
          title: 'Categoria excluída!',
          description: 'A categoria foi removida com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir a categoria.',
        });
      }
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Categorias' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de produtos e serviços
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingCategoria(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados da categoria
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input id="nome" name="nome" placeholder="Nome da categoria" defaultValue={editingCategoria?.nome} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input id="descricao" name="descricao" placeholder="Descrição da categoria" defaultValue={editingCategoria?.descricao} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map((color) => (
                        <label key={color.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="cor"
                            value={color.value}
                            defaultChecked={editingCategoria?.cor === color.value || (!editingCategoria && color.value === '#3b82f6')}
                            className="sr-only peer"
                          />
                          <div
                            className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-gray-800 transition-all"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        </label>
                      ))}
                    </div>
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
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{categorias.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold">{categorias.filter(c => c.ativa).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cores Usadas</p>
                  <p className="text-2xl font-bold">{new Set(categorias.map(c => c.cor)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Categorias</CardTitle>
            <CardDescription>Todas as categorias cadastradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {categorias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
                <p className="text-sm">Clique em &quot;Nova Categoria&quot; para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map((categoria) => (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: categoria.cor }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{categoria.nome}</TableCell>
                        <TableCell>{categoria.descricao || '-'}</TableCell>
                        <TableCell>
                          <Badge className={categoria.ativa ? 'bg-green-500' : 'bg-gray-500'}>
                            {categoria.ativa ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(categoria)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(categoria.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </MainLayout>
  );
}
