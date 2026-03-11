'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import { Tenant } from '@/types';
import { createNewTenant, deleteTenant } from '@/lib/admin-service';
import {
  Shield,
  Building2,
  DollarSign,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  PauseCircle,
  Calendar,
  Eye,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Database,
  Loader2,
  Package,
  UserCheck,
  FileText,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addMonths, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { checkTestDataExists, initializeTestUserData, clearTestData } from '@/lib/init-data';

// Planos disponíveis
const PLANOS = [
  { id: 'basico', nome: 'Básico', preco: 99, limiteProdutos: 100, limiteUsuarios: 2, cor: 'bg-gray-500' },
  { id: 'profissional', nome: 'Profissional', preco: 199, limiteProdutos: 500, limiteUsuarios: 5, cor: 'bg-blue-500' },
  { id: 'enterprise', nome: 'Enterprise', preco: 399, limiteProdutos: 0, limiteUsuarios: 0, cor: 'bg-purple-500' },
];

export default function MasterAdminPage() {
  const { user, tenant: currentTenant } = useAuthStore();
  const { tenants, loadTenants, addTenant, updateTenantStatus, setTenants } = useAppStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPlano, setFiltroPlano] = useState<string>('todos');
  const [dialogNovaEmpresa, setDialogNovaEmpresa] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [excluindoEmpresa, setExcluindoEmpresa] = useState<string | null>(null);

  // Estados para popular dados
  const [dataExists, setDataExists] = useState(false);
  const [populatingData, setPopulatingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [activeTab, setActiveTab] = useState('empresas');

  // Formulário nova empresa
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise',
    meses: 1,
  });

  // Carregar tenants ao montar
  useEffect(() => {
    loadTenants();
    // Verificar se dados existem
    checkTestDataExists().then(setDataExists);
  }, [loadTenants]);

  // Popular dados de teste
  const handlePopularDados = async () => {
    if (!confirm('Isso irá criar dados de teste para o usuário teste@teste.com. Deseja continuar?')) return;
    
    setPopulatingData(true);
    try {
      await initializeTestUserData();
      setDataExists(true);
      toast({
        title: 'Dados populados com sucesso!',
        description: 'A base de dados de teste foi criada. Login: teste@teste.com',
      });
      loadTenants();
    } catch (error) {
      console.error('Erro ao popular dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao popular dados' });
    } finally {
      setPopulatingData(false);
    }
  };

  // Limpar dados de teste
  const handleLimparDados = async () => {
    if (!confirm('ATENÇÃO: Isso irá apagar TODOS os dados de teste. Deseja continuar?')) return;
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita!')) return;
    
    setClearingData(true);
    try {
      await clearTestData();
      setDataExists(false);
      toast({
        title: 'Dados limpos com sucesso!',
        description: 'Todos os dados de teste foram removidos.',
      });
      loadTenants();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao limpar dados' });
    } finally {
      setClearingData(false);
    }
  };

  // Verificar se é admin master
  const isMaster = user?.role === 'admin' && user?.tenantId === 'admin-master';

  if (!isMaster) {
    return (
      <MainLayout breadcrumbs={[{ title: 'Admin Master' }]}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Shield className="h-12 w-12 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-red-800">Acesso Restrito</h2>
                <p className="text-red-700">Esta área é exclusiva para administradores do sistema.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // Filtrar empresas
  const empresasFiltradas = tenants.filter(empresa => {
    const matchSearch = 
      empresa.nome.toLowerCase().includes(search.toLowerCase()) ||
      empresa.cnpj.includes(search) ||
      empresa.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || empresa.status === filtroStatus;
    const matchPlano = filtroPlano === 'todos' || empresa.plano === filtroPlano;
    return matchSearch && matchStatus && matchPlano;
  });

  // Estatísticas
  const stats = {
    total: tenants.length,
    ativos: tenants.filter(e => e.status === 'ativo').length,
    suspensos: tenants.filter(e => e.status === 'suspenso').length,
    expirados: tenants.filter(e => e.status === 'expirado' || (e.dataExpiracao && isBefore(new Date(e.dataExpiracao), new Date()))).length,
    receitaMensal: tenants
      .filter(e => e.status === 'ativo')
      .reduce((acc, e) => {
        const plano = PLANOS.find(p => p.id === e.plano);
        return acc + (plano?.preco || 0);
      }, 0),
    expirandoEm7Dias: tenants.filter(e => {
      if (!e.dataExpiracao) return false;
      const exp = new Date(e.dataExpiracao);
      const hoje = new Date();
      const em7Dias = addDays(hoje, 7);
      return isAfter(exp, hoje) && isBefore(exp, em7Dias);
    }).length,
  };

  // Criar nova empresa
  const handleCriarEmpresa = async () => {
    if (!novaEmpresa.nome || !novaEmpresa.cnpj || !novaEmpresa.email) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    setSaving(true);
    try {
      // Calcular data de expiração
      const dataExpiracao = addMonths(new Date(), novaEmpresa.meses);

      // Criar a empresa no Firestore
      const tenantId = await createNewTenant({
        nome: novaEmpresa.nome,
        cnpj: novaEmpresa.cnpj,
        email: novaEmpresa.email,
        telefone: novaEmpresa.telefone,
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        plano: novaEmpresa.plano,
        dataExpiracao
      });

      console.log('Empresa criada com ID:', tenantId);

      // Adicionar a nova empresa diretamente no estado local para atualização imediata
      const novoTenant: Tenant = {
        id: tenantId,
        nome: novaEmpresa.nome,
        cnpj: novaEmpresa.cnpj,
        email: novaEmpresa.email,
        telefone: novaEmpresa.telefone,
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        plano: novaEmpresa.plano,
        status: 'ativo',
        dataCriacao: new Date(),
        dataExpiracao,
        configuracoes: {
          corTema: '#2563eb',
          logoUrl: '',
          moeda: 'BRL',
          timezone: 'America/Sao_Paulo',
          nfSerie: 1,
          nfNumeroAtual: 1000
        }
      };

      addTenant(novoTenant);

      toast({
        title: 'Empresa criada!',
        description: `${novaEmpresa.nome} foi cadastrada com sucesso.`,
      });

      setDialogNovaEmpresa(false);
      setNovaEmpresa({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        plano: 'basico',
        meses: 1,
      });

    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({ variant: 'destructive', title: 'Erro ao criar empresa', description: String(error) });
    } finally {
      setSaving(false);
    }
  };

  // Alterar status da empresa
  const handleAlterarStatus = async (empresa: Tenant, novoStatus: 'ativo' | 'suspenso' | 'expirado') => {
    try {
      await updateTenantStatus(empresa.id, novoStatus);
      toast({
        title: 'Status alterado!',
        description: `${empresa.nome} foi ${novoStatus === 'ativo' ? 'ativado' : novoStatus === 'suspenso' ? 'suspenso' : 'marcado como expirado'}.`,
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
    }
  };

  // Estender período
  const handleEstenderPeriodo = async (empresa: Tenant, meses: number) => {
    try {
      const novaData = addMonths(empresa.dataExpiracao || new Date(), meses);
      toast({
        title: 'Período estendido!',
        description: `${empresa.nome} - Nova expiração: ${format(novaData, "dd/MM/yyyy", { locale: ptBR })}`,
      });
      loadTenants();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao estender período' });
    }
  };

  // Excluir empresa
  const handleExcluirEmpresa = async (empresa: Tenant) => {
    // Confirmação dupla
    if (!confirm(`TEM CERTEZA que deseja excluir a empresa "${empresa.nome}"?\n\nEsta ação é IRREVERSÍVEL e apagará TODOS os dados da empresa, incluindo:\n- Produtos e categorias\n- Clientes e fornecedores\n- Vendas e pedidos\n- Notas fiscais\n- Contas a pagar e receber\n- Funcionários e vendedores\n\nDeseja continuar?`)) {
      return;
    }

    if (!confirm(`ÚLTIMA CONFIRMAÇÃO!\n\nA empresa "${empresa.nome}" será EXCLUÍDA PERMANENTEMENTE.\n\nDigite "EXCLUIR" e pressione OK para confirmar.`)) {
      return;
    }

    setExcluindoEmpresa(empresa.id);
    try {
      console.log('Excluindo empresa:', empresa.id, empresa.nome);
      await deleteTenant(empresa.id);

      // Remover do estado local
      setTenants(tenants.filter(t => t.id !== empresa.id));

      toast({
        title: 'Empresa excluída!',
        description: `${empresa.nome} foi removida permanentemente do sistema.`,
      });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({ variant: 'destructive', title: 'Erro ao excluir empresa', description: String(error) });
    } finally {
      setExcluindoEmpresa(null);
    }
  };

  // Badge de status
  const getStatusBadge = (empresa: Tenant) => {
    const expirado = empresa.dataExpiracao && isBefore(new Date(empresa.dataExpiracao), new Date());
    
    if (expirado || empresa.status === 'expirado') {
      return <Badge className="bg-red-500">Expirado</Badge>;
    }
    if (empresa.status === 'suspenso') {
      return <Badge className="bg-yellow-500">Suspenso</Badge>;
    }
    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  // Badge do plano
  const getPlanoBadge = (plano: string) => {
    const p = PLANOS.find(x => x.id === plano);
    return (
      <Badge className={p?.cor || 'bg-gray-500'}>
        {p?.nome || plano}
      </Badge>
    );
  };

  return (
    <MainLayout breadcrumbs={[{ title: 'Admin Master' }, { title: 'Painel de Controle' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              Painel Admin Master
            </h1>
            <p className="text-muted-foreground">
              Gerencie todas as empresas e dados do sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="empresas" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <Database className="h-4 w-4" />
              Popular Dados
            </TabsTrigger>
          </TabsList>

          {/* Tab Empresas */}
          <TabsContent value="empresas" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={dialogNovaEmpresa} onOpenChange={setDialogNovaEmpresa}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    <Plus className="h-4 w-4" />
                    Nova Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar uma nova empresa no sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Empresa *</Label>
                      <Input
                        id="nome"
                        value={novaEmpresa.nome}
                        onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
                        placeholder="Razão Social"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={novaEmpresa.cnpj}
                        onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={novaEmpresa.email}
                          onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
                          placeholder="empresa@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={novaEmpresa.telefone}
                          onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })}
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plano">Plano</Label>
                        <Select
                          value={novaEmpresa.plano}
                          onValueChange={(value) => setNovaEmpresa({ ...novaEmpresa, plano: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANOS.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome} - R$ {p.preco}/mês
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meses">Período (meses)</Label>
                        <Select
                          value={novaEmpresa.meses.toString()}
                          onValueChange={(value) => setNovaEmpresa({ ...novaEmpresa, meses: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 mês</SelectItem>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogNovaEmpresa(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCriarEmpresa} disabled={saving}>
                      {saving ? 'Criando...' : 'Criar Empresa'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Empresas</p>
                      <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                      <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Suspensas</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.suspensos}</p>
                    </div>
                    <PauseCircle className="h-8 w-8 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Expirando em 7 dias</p>
                      <p className="text-3xl font-bold text-red-600">{stats.expirandoEm7Dias}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Mensal</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        R$ {stats.receitaMensal.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerta de expiração */}
            {stats.expirandoEm7Dias > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800">
                        Atenção: {stats.expirandoEm7Dias} empresa(s) expirando nos próximos 7 dias
                      </p>
                      <p className="text-sm text-orange-700">
                        Entre em contato para renovação ou suspenda o acesso.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CNPJ ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="suspenso">Suspensos</SelectItem>
                      <SelectItem value="expirado">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {PLANOS.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Empresas */}
            <Card>
              <CardHeader>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>
                  {empresasFiltradas.length} empresa(s) encontrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma empresa encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        empresasFiltradas.map((empresa) => {
                          const expirado = empresa.dataExpiracao && isBefore(new Date(empresa.dataExpiracao), new Date());
                          const expiraEm7Dias = empresa.dataExpiracao && 
                            isBefore(new Date(empresa.dataExpiracao), addDays(new Date(), 7)) &&
                            isAfter(new Date(empresa.dataExpiracao), new Date());

                          return (
                            <TableRow key={empresa.id} className={expirado ? 'bg-red-50' : expiraEm7Dias ? 'bg-orange-50' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {empresa.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{empresa.nome}</p>
                                    <p className="text-sm text-muted-foreground">{empresa.cnpj}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getPlanoBadge(empresa.plano)}</TableCell>
                              <TableCell>{getStatusBadge(empresa)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className={expirado ? 'text-red-600 font-medium' : expiraEm7Dias ? 'text-orange-600 font-medium' : ''}>
                                    {empresa.dataExpiracao 
                                      ? format(new Date(empresa.dataExpiracao), "dd/MM/yyyy", { locale: ptBR })
                                      : '-'
                                    }
                                  </span>
                                  {expiraEm7Dias && (
                                    <Clock className="h-4 w-4 text-orange-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    {empresa.email}
                                  </div>
                                  {empresa.telefone && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      {empresa.telefone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setEmpresaSelecionada(empresa); setDialogDetalhes(true); }}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEstenderPeriodo(empresa, 1)}>
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Estender +1 mês
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEstenderPeriodo(empresa, 12)}>
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Estender +1 ano
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {empresa.status !== 'ativo' && (
                                      <DropdownMenuItem onClick={() => handleAlterarStatus(empresa, 'ativo')}>
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Ativar
                                      </DropdownMenuItem>
                                    )}
                                    {empresa.status === 'ativo' && (
                                      <DropdownMenuItem onClick={() => handleAlterarStatus(empresa, 'suspenso')}>
                                        <PauseCircle className="h-4 w-4 mr-2 text-yellow-600" />
                                        Suspender
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleAlterarStatus(empresa, 'expirado')} className="text-red-600">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Marcar Expirado
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleExcluirEmpresa(empresa)}
                                      className="text-red-600 focus:bg-red-50"
                                      disabled={excluindoEmpresa === empresa.id}
                                    >
                                      {excluindoEmpresa === empresa.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                      )}
                                      {excluindoEmpresa === empresa.id ? 'Excluindo...' : 'Excluir Empresa'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Popular Dados */}
          <TabsContent value="dados" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Popular Base de Dados de Teste
                </CardTitle>
                <CardDescription>
                  Crie dados de demonstração para o usuário teste@teste.com
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status */}
                <div className={`p-4 rounded-lg ${dataExists ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    {dataExists ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${dataExists ? 'text-yellow-800' : 'text-green-800'}`}>
                        {dataExists ? 'Dados já existem no sistema' : 'Sistema pronto para popular'}
                      </p>
                      <p className={`text-sm ${dataExists ? 'text-yellow-700' : 'text-green-700'}`}>
                        {dataExists 
                          ? 'Já existem dados para o usuário teste@teste.com. Use "Limpar Dados" antes de popular novamente para evitar duplicações.'
                          : 'Você pode popular a base de dados com dados de demonstração completos.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dados que serão criados */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Produtos</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <UserCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-sm text-muted-foreground">Clientes</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Fornecedores</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Building2 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-sm text-muted-foreground">Funcionários</p>
                  </Card>
                </div>

                {/* Lista de dados */}
                <div className="space-y-2">
                  <p className="font-medium">Serão criados:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Tenant (Empresa Teste LTDA)</li>
                    <li>✓ Usuário de teste (teste@teste.com)</li>
                    <li>✓ 5 Categorias de produtos</li>
                    <li>✓ 12 Produtos (10 produtos + 2 serviços)</li>
                    <li>✓ 4 Clientes</li>
                    <li>✓ 3 Fornecedores</li>
                    <li>✓ 2 Funcionários</li>
                    <li>✓ Contas a pagar e receber</li>
                    <li>✓ Pedidos e vendas de exemplo</li>
                    <li>✓ Ordens de serviço</li>
                    <li>✓ Notas fiscais de exemplo</li>
                  </ul>
                </div>

                {/* Botões */}
                <div className="flex gap-4">
                  <Button
                    onClick={handlePopularDados}
                    disabled={populatingData || clearingData}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {populatingData ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Populando...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Popular Dados
                      </>
                    )}
                  </Button>
                  
                  {dataExists && (
                    <Button
                      onClick={handleLimparDados}
                      disabled={populatingData || clearingData}
                      variant="destructive"
                      className="gap-2"
                    >
                      {clearingData ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Limpando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Limpar Dados
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Info adicional */}
                <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg">
                  <p><strong>Usuário de teste:</strong> teste@teste.com</p>
                  <p><strong>Senha:</strong> Use o Firebase Console para definir a senha ou crie o usuário primeiro</p>
                  <p><strong>Admin Master:</strong> baisinextel@gmail.com</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Detalhes */}
        <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Empresa</DialogTitle>
            </DialogHeader>
            {empresaSelecionada && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {empresaSelecionada.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{empresaSelecionada.nome}</h3>
                    <p className="text-muted-foreground">{empresaSelecionada.cnpj}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{getPlanoBadge(empresaSelecionada.plano)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{getStatusBadge(empresaSelecionada)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{empresaSelecionada.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{empresaSelecionada.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {format(new Date(empresaSelecionada.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Expiração</p>
                    <p className="font-medium">
                      {empresaSelecionada.dataExpiracao 
                        ? format(new Date(empresaSelecionada.dataExpiracao), "dd/MM/yyyy", { locale: ptBR })
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                {empresaSelecionada.endereco && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                    <p className="font-medium">
                      {empresaSelecionada.endereco.logradouro}, {empresaSelecionada.endereco.numero}
                      {empresaSelecionada.endereco.cidade && ` - ${empresaSelecionada.endereco.cidade}/${empresaSelecionada.endereco.estado}`}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogDetalhes(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
