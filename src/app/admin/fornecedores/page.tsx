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
import { Fornecedor } from '@/types';
import {
  Truck,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FornecedoresPage() {
  const { tenant } = useAuthStore();
  const { fornecedores, addFornecedor, updateFornecedor, deleteFornecedor, loadFornecedores } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Carregar fornecedores se não estiverem carregados
  React.useEffect(() => {
    if (fornecedores.length === 0) {
      loadFornecedores();
    }
  }, []);

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj.includes(searchTerm) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const fornecedorData: Fornecedor = {
        id: editingFornecedor?.id || `forn-${Date.now()}`,
        tenantId: tenant?.id || '',
        nome: formData.get('nome') as string,
        razaoSocial: formData.get('razaoSocial') as string || undefined,
        cnpj: formData.get('cnpj') as string,
        inscricaoEstadual: formData.get('inscricaoEstadual') as string || undefined,
        email: formData.get('email') as string,
        telefone: formData.get('telefone') as string,
        telefone2: formData.get('telefone2') as string || undefined,
        endereco: {
          logradouro: formData.get('logradouro') as string || '',
          numero: formData.get('numero') as string || '',
          complemento: formData.get('complemento') as string || '',
          bairro: formData.get('bairro') as string || '',
          cidade: formData.get('cidade') as string || '',
          estado: formData.get('estado') as string || '',
          cep: formData.get('cep') as string || '',
        },
        contato: formData.get('contato') as string || '',
        cargo: formData.get('cargo') as string || undefined,
        site: formData.get('site') as string || undefined,
        observacoes: formData.get('observacoes') as string || undefined,
        ativo: true,
        dataCriacao: editingFornecedor?.dataCriacao || new Date(),
      };

      if (editingFornecedor) {
        await updateFornecedor(editingFornecedor.id, fornecedorData);
        toast({
          title: 'Fornecedor atualizado!',
          description: 'Os dados do fornecedor foram atualizados com sucesso.',
        });
      } else {
        await addFornecedor(fornecedorData);
        toast({
          title: 'Fornecedor cadastrado!',
          description: 'O novo fornecedor foi adicionado com sucesso.',
        });
      }

      setDialogOpen(false);
      setEditingFornecedor(null);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o fornecedor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteFornecedor(id);
        toast({
          title: 'Fornecedor excluído!',
          description: 'O fornecedor foi removido com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir o fornecedor.',
        });
      }
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Fornecedores' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie os fornecedores do seu negócio
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingFornecedor(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do fornecedor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Fantasia *</Label>
                      <Input id="nome" name="nome" placeholder="Nome de fantasia" defaultValue={editingFornecedor?.nome} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input id="razaoSocial" name="razaoSocial" placeholder="Razão social" defaultValue={editingFornecedor?.razaoSocial} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" defaultValue={editingFornecedor?.cnpj} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                      <Input id="inscricaoEstadual" name="inscricaoEstadual" placeholder="IE" defaultValue={editingFornecedor?.inscricaoEstadual} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site">Site</Label>
                      <Input id="site" name="site" placeholder="www.exemplo.com" defaultValue={editingFornecedor?.site} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input id="email" name="email" type="email" placeholder="email@exemplo.com" defaultValue={editingFornecedor?.email} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input id="telefone" name="telefone" placeholder="(00) 0000-0000" defaultValue={editingFornecedor?.telefone} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone2">Telefone 2</Label>
                      <Input id="telefone2" name="telefone2" placeholder="(00) 0000-0000" defaultValue={editingFornecedor?.telefone2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato</Label>
                      <Input id="contato" name="contato" placeholder="Nome do contato" defaultValue={editingFornecedor?.contato} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input id="logradouro" name="logradouro" placeholder="Rua, Avenida..." defaultValue={editingFornecedor?.endereco?.logradouro} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input id="numero" name="numero" placeholder="123" defaultValue={editingFornecedor?.endereco?.numero} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input id="complemento" name="complemento" placeholder="Sala, Andar..." defaultValue={editingFornecedor?.endereco?.complemento} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input id="bairro" name="bairro" placeholder="Bairro" defaultValue={editingFornecedor?.endereco?.bairro} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" name="cidade" placeholder="Cidade" defaultValue={editingFornecedor?.endereco?.cidade} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Input id="estado" name="estado" placeholder="UF" defaultValue={editingFornecedor?.endereco?.estado} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input id="cep" name="cep" placeholder="00000-000" defaultValue={editingFornecedor?.endereco?.cep} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input id="observacoes" name="observacoes" placeholder="Observações adicionais" defaultValue={editingFornecedor?.observacoes} />
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
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{fornecedores.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{fornecedores.filter(f => f.ativo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Encontrados</p>
                  <p className="text-2xl font-bold">{filteredFornecedores.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {filteredFornecedores.length} fornecedor(es)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Fornecedores</CardTitle>
            <CardDescription>Todos os fornecedores cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFornecedores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum fornecedor encontrado</p>
                <p className="text-sm">Clique em "Novo Fornecedor" para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fornecedor.nome}</p>
                            {fornecedor.razaoSocial && (
                              <p className="text-sm text-muted-foreground">{fornecedor.razaoSocial}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{fornecedor.cnpj}</TableCell>
                        <TableCell>
                          <div>
                            <p>{fornecedor.contato || '-'}</p>
                            {fornecedor.cargo && (
                              <p className="text-xs text-muted-foreground">{fornecedor.cargo}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {fornecedor.telefone}
                          </p>
                          {fornecedor.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {fornecedor.email}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {fornecedor.endereco?.cidade && (
                            <p>{fornecedor.endereco.cidade}/{fornecedor.endereco.estado}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={fornecedor.ativo ? 'bg-green-500' : 'bg-gray-500'}>
                            {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(fornecedor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(fornecedor.id)}>
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
