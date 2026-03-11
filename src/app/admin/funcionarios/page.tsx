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
import { Funcionario, PermissoesAcesso } from '@/types';
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const cargos = [
  'Gerente',
  'Vendedor',
  'Caixa',
  'Atendente',
  'Técnico',
  'Auxiliar Administrativo',
  'Financeiro',
  'Outro',
];

const departamentos = [
  'Vendas',
  'Financeiro',
  'Operacional',
  'Administrativo',
  'TI',
  'RH',
  'Outro',
];

const permissoesDefault: PermissoesAcesso = {
  dashboard: true,
  produtos: false,
  estoque: false,
  financeiro: false,
  faturamento: false,
  pdv: false,
  pedidos: false,
  operacional: false,
  parametros: false,
  admin: false,
  funcionarios: false,
  categorias: false,
  fornecedores: false,
  clientes: false,
  unidades: false,
  relatorios: false,
};

export default function FuncionariosPage() {
  const { tenant, user: currentUser } = useAuthStore();
  const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, toggleFuncionarioAtivo, loadFuncionarios } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Carregar funcionários se não estiverem carregados
  React.useEffect(() => {
    if (funcionarios.length === 0) {
      loadFuncionarios();
    }
  }, []);

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cpf.includes(searchTerm) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      // Coletar permissões
      const permissoes: PermissoesAcesso = { ...permissoesDefault };
      Object.keys(permissoes).forEach(key => {
        const value = formData.get(`perm_${key}`);
        permissoes[key as keyof PermissoesAcesso] = value === 'on';
      });

      const funcionarioData: Funcionario = {
        id: editingFuncionario?.id || `func-${Date.now()}`,
        tenantId: tenant?.id || '',
        nome: formData.get('nome') as string,
        cpf: formData.get('cpf') as string,
        rg: formData.get('rg') as string || undefined,
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
        cargo: formData.get('cargo') as string,
        departamento: formData.get('departamento') as string,
        salario: parseFloat(formData.get('salario') as string) || undefined,
        dataAdmissao: formData.get('dataAdmissao') ? new Date(formData.get('dataAdmissao') as string) : undefined,
        dataNascimento: formData.get('dataNascimento') ? new Date(formData.get('dataNascimento') as string) : undefined,
        permissoes,
        senha: editingFuncionario?.senha || 'senha123', // Em produção, gerar senha temporária
        ativo: true,
        podeAcessarSistema: formData.get('podeAcessarSistema') === 'on',
        dataCriacao: editingFuncionario?.dataCriacao || new Date(),
        dataAtualizacao: new Date(),
        criadoPor: currentUser?.id || '',
      };

      if (editingFuncionario) {
        await updateFuncionario(editingFuncionario.id, funcionarioData);
        toast({
          title: 'Funcionário atualizado!',
          description: 'Os dados do funcionário foram atualizados com sucesso.',
        });
      } else {
        await addFuncionario(funcionarioData);
        toast({
          title: 'Funcionário cadastrado!',
          description: 'O novo funcionário foi adicionado com sucesso.',
        });
      }

      setDialogOpen(false);
      setEditingFuncionario(null);
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o funcionário.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await deleteFuncionario(id);
        toast({
          title: 'Funcionário excluído!',
          description: 'O funcionário foi removido com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir o funcionário.',
        });
      }
    }
  };

  const handleToggleAtivo = (id: string) => {
    toggleFuncionarioAtivo(id);
    toast({
      title: 'Status alterado!',
      description: 'O status do funcionário foi atualizado.',
    });
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Funcionários' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe e permissões de acesso
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingFuncionario(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFuncionario ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do funcionário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave}>
                <div className="space-y-6 py-4">
                  {/* Dados Pessoais */}
                  <div>
                    <h4 className="font-medium mb-3">Dados Pessoais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input id="nome" name="nome" placeholder="Nome completo" defaultValue={editingFuncionario?.nome} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input id="cpf" name="cpf" placeholder="000.000.000-00" defaultValue={editingFuncionario?.cpf} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input id="rg" name="rg" placeholder="RG" defaultValue={editingFuncionario?.rg} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                        <Input id="dataNascimento" name="dataNascimento" type="date" defaultValue={editingFuncionario?.dataNascimento?.toISOString().split('T')[0]} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" defaultValue={editingFuncionario?.telefone} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input id="email" name="email" type="email" placeholder="email@exemplo.com" defaultValue={editingFuncionario?.email} required />
                      </div>
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div>
                    <h4 className="font-medium mb-3">Dados Profissionais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo *</Label>
                        <Select name="cargo" defaultValue={editingFuncionario?.cargo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargos.map((cargo) => (
                              <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento *</Label>
                        <Select name="departamento" defaultValue={editingFuncionario?.departamento}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salario">Salário</Label>
                        <Input id="salario" name="salario" type="number" step="0.01" placeholder="0,00" defaultValue={editingFuncionario?.salario} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                        <Input id="dataAdmissao" name="dataAdmissao" type="date" defaultValue={editingFuncionario?.dataAdmissao?.toISOString().split('T')[0]} />
                      </div>
                    </div>
                  </div>

                  {/* Acesso ao Sistema */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Acesso ao Sistema</h4>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="podeAcessarSistema" defaultChecked={editingFuncionario?.podeAcessarSistema} className="h-4 w-4" />
                        <span className="text-sm">Pode acessar o sistema</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border rounded-lg p-4">
                      {Object.keys(permissoesDefault).map((key) => (
                        <label key={key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name={`perm_${key}`}
                            defaultChecked={editingFuncionario?.permissoes?.[key as keyof PermissoesAcesso] || false}
                            className="h-4 w-4"
                          />
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{funcionarios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{funcionarios.filter(f => f.ativo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Com Acesso</p>
                  <p className="text-2xl font-bold">{funcionarios.filter(f => f.podeAcessarSistema).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold">{funcionarios.filter(f => !f.ativo).length}</p>
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
                  placeholder="Buscar por nome, e-mail, CPF ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {filteredFuncionarios.length} funcionário(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>Todos os funcionários cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFuncionarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum funcionário encontrado</p>
                <p className="text-sm">Clique em "Novo Funcionário" para adicionar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuncionarios.map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{funcionario.nome}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {funcionario.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{funcionario.cpf}</TableCell>
                        <TableCell>{funcionario.cargo}</TableCell>
                        <TableCell>{funcionario.departamento}</TableCell>
                        <TableCell>
                          {funcionario.telefone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {funcionario.telefone}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {funcionario.podeAcessarSistema ? (
                            <Badge className="bg-violet-500">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={funcionario.ativo ? 'bg-green-500' : 'bg-red-500'}>
                            {funcionario.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(funcionario)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={funcionario.ativo ? 'text-orange-600' : 'text-green-600'}
                              onClick={() => handleToggleAtivo(funcionario.id)}
                            >
                              {funcionario.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(funcionario.id)}>
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
