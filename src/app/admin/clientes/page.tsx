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
import { Cliente } from '@/types';
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClientesPage() {
  const { user } = useAuthStore();
  const { clientes, addCliente, updateClienteStore, deleteClienteStore } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpfCnpj.includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const tenant = useAuthStore.getState().tenant;
    const currentUser = useAuthStore.getState().user;

    console.log('=== HANDLE SAVE CLIENTE ===');
    console.log('tenant:', tenant);
    console.log('tenant?.id:', tenant?.id);
    console.log('currentUser:', currentUser?.email);

    // Validar tenant
    if (!tenant?.id) {
      console.error('ERRO: Tenant não definido!');
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Tenant não encontrado. Faça login novamente.',
      });
      setSaving(false);
      return;
    }

    try {
      const clienteData: Cliente = {
        id: editingCliente?.id || `cli-${Date.now()}`,
        tenantId: tenant.id,
        nome: formData.get('nome') as string,
        cpfCnpj: formData.get('cpfCnpj') as string,
        email: formData.get('email') as string,
        telefone: formData.get('telefone') as string,
        endereco: {
          logradouro: formData.get('logradouro') as string || '',
          numero: formData.get('numero') as string || '',
          complemento: formData.get('complemento') as string || '',
          bairro: formData.get('bairro') as string || '',
          cidade: formData.get('cidade') as string || '',
          estado: formData.get('estado') as string || '',
          cep: formData.get('cep') as string || '',
        },
        observacoes: formData.get('observacoes') as string || '',
        ativo: true,
      };

      console.log('Salvando cliente:', clienteData);

      if (editingCliente) {
        await updateClienteStore(editingCliente.id, clienteData);
        toast({
          title: 'Cliente atualizado!',
          description: 'Os dados do cliente foram atualizados com sucesso.',
        });
      } else {
        await addCliente(clienteData);
        console.log('Cliente adicionado ao store');
        toast({
          title: 'Cliente cadastrado!',
          description: 'O novo cliente foi adicionado com sucesso.',
        });
      }

      setDialogOpen(false);
      setEditingCliente(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o cliente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteClienteStore(id);
        toast({
          title: 'Cliente excluído!',
          description: 'O cliente foi removido com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir o cliente.',
        });
      }
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Clientes' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie a base de clientes do seu negócio
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingCliente(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="nome">Nome / Razão Social *</Label>
                      <Input id="nome" name="nome" placeholder="Nome completo ou razão social" defaultValue={editingCliente?.nome} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                      <Input id="cpfCnpj" name="cpfCnpj" placeholder="000.000.000-00" defaultValue={editingCliente?.cpfCnpj} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" defaultValue={editingCliente?.telefone} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" name="email" type="email" placeholder="email@exemplo.com" defaultValue={editingCliente?.email} />
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
                        <Input id="logradouro" name="logradouro" placeholder="Rua, Avenida..." defaultValue={editingCliente?.endereco?.logradouro} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input id="numero" name="numero" placeholder="123" defaultValue={editingCliente?.endereco?.numero} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input id="complemento" name="complemento" placeholder="Sala, Apto..." defaultValue={editingCliente?.endereco?.complemento} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input id="bairro" name="bairro" placeholder="Bairro" defaultValue={editingCliente?.endereco?.bairro} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" name="cidade" placeholder="Cidade" defaultValue={editingCliente?.endereco?.cidade} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Input id="estado" name="estado" placeholder="UF" defaultValue={editingCliente?.endereco?.estado} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input id="cep" name="cep" placeholder="00000-000" defaultValue={editingCliente?.endereco?.cep} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input id="observacoes" name="observacoes" placeholder="Observações adicionais" defaultValue={editingCliente?.observacoes} />
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

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {filteredClientes.length} cliente(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Todos os clientes cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum cliente encontrado</p>
                <p className="text-sm">Clique em "Novo Cliente" para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            {cliente.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{cliente.cpfCnpj}</TableCell>
                        <TableCell>
                          {cliente.telefone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {cliente.telefone}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {cliente.endereco?.cidade && (
                            <p>{cliente.endereco.cidade}/{cliente.endereco.estado}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cliente.ativo ? 'bg-green-500' : 'bg-gray-500'}>
                            {cliente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(cliente)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(cliente.id)}>
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
