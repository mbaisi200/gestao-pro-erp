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
import { UnidadeMedida } from '@/types';
import {
  Ruler,
  Plus,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UnidadesPage() {
  const { tenant } = useAuthStore();
  const { unidadesMedida, addUnidadeMedida, updateUnidadeMedida, deleteUnidadeMedida } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeMedida | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const unidadeData: UnidadeMedida = {
        id: editingUnidade?.id || `un-${Date.now()}`,
        tenantId: tenant?.id || '',
        sigla: formData.get('sigla') as string,
        nome: formData.get('nome') as string,
        fatorConversao: parseFloat(formData.get('fatorConversao') as string) || undefined,
        unidadeBase: formData.get('unidadeBase') as string || undefined,
        ativo: true,
      };

      if (editingUnidade) {
        await updateUnidadeMedida(editingUnidade.id, unidadeData);
        toast({
          title: 'Unidade atualizada!',
          description: 'Os dados da unidade foram atualizados com sucesso.',
        });
      } else {
        await addUnidadeMedida(unidadeData);
        toast({
          title: 'Unidade cadastrada!',
          description: 'A nova unidade de medida foi adicionada com sucesso.',
        });
      }

      setDialogOpen(false);
      setEditingUnidade(null);
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar a unidade de medida.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (unidade: UnidadeMedida) => {
    setEditingUnidade(unidade);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade de medida?')) {
      try {
        await deleteUnidadeMedida(id);
        toast({
          title: 'Unidade excluída!',
          description: 'A unidade de medida foi removida com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir unidade:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir a unidade de medida.',
        });
      }
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Unidades de Medida' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Unidades de Medida</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades de medida dos produtos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingUnidade(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnidade ? 'Editar Unidade' : 'Nova Unidade de Medida'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados da unidade de medida
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sigla">Sigla *</Label>
                      <Input id="sigla" name="sigla" placeholder="UN, CX, KG..." defaultValue={editingUnidade?.sigla} required maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input id="nome" name="nome" placeholder="Unidade, Caixa, Quilograma..." defaultValue={editingUnidade?.nome} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fatorConversao">Fator de Conversão</Label>
                      <Input id="fatorConversao" name="fatorConversao" type="number" step="0.0001" placeholder="Ex: 12 (1 CX = 12 UN)" defaultValue={editingUnidade?.fatorConversao} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidadeBase">Unidade Base</Label>
                      <Input id="unidadeBase" name="unidadeBase" placeholder="Sigla da unidade base" defaultValue={editingUnidade?.unidadeBase} />
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Ruler className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{unidadesMedida.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Ruler className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold">{unidadesMedida.filter(u => u.ativo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Unidades</CardTitle>
            <CardDescription>Todas as unidades de medida cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {unidadesMedida.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ruler className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma unidade de medida encontrada</p>
                <p className="text-sm">Clique em "Nova Unidade" para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sigla</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Fator Conversão</TableHead>
                      <TableHead>Unidade Base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidadesMedida.map((unidade) => (
                      <TableRow key={unidade.id}>
                        <TableCell className="font-mono font-semibold">{unidade.sigla}</TableCell>
                        <TableCell>{unidade.nome}</TableCell>
                        <TableCell>{unidade.fatorConversao || '-'}</TableCell>
                        <TableCell>{unidade.unidadeBase || '-'}</TableCell>
                        <TableCell>
                          <Badge className={unidade.ativo ? 'bg-green-500' : 'bg-gray-500'}>
                            {unidade.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(unidade)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(unidade.id)}>
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
