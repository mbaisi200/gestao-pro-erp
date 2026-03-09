'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore, Module } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AdminModule } from '@/components/AdminModule';
import { 
  LayoutDashboard, Package, DollarSign, FileText, ShoppingCart, Wrench, 
  Menu, X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, 
  Plus, Trash2, Edit, Upload, Search, Download, Eye, ChevronUp, ChevronDown,
  Bell, LogOut, Shield, FileSpreadsheet, User, Settings, Printer, Banknote,
  CreditCard, Barcode, Tags, Archive, ArrowRightLeft, FileInput, Users, Truck, Ruler,
  Wallet, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Produto, ContaPagar, ContaReceber, Pedido, OrdemServico, Cliente, ConfigBanco, ConfigImpressora, TipoItem, Funcionario, PermissoesAcesso, Categoria, Fornecedor, UnidadeMedida, NotaFiscal } from '@/types';
import { salesChartData, fluxoCaixaData } from '@/data/mock';

// Utilitário para formatação de moeda
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Utilitário para formatação de data
const formatDate = (date: Date) => 
  format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });

// Componente para cabeçalho de tabela ordenável
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

function SortableHeader({ label, sortKey, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  return (
    <button 
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive && (
        currentSort.direction === 'asc' 
          ? <ChevronUp size={14} /> 
          : <ChevronDown size={14} />
      )}
    </button>
  );
}

export function ERPSaaS() {
  const { currentModule, setModule, isAdmin: isAdminStore, subscribeToData, unsubscribeAll } = useAppStore();
  const { user, tenant, logout, firebaseUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = firebaseUser?.role === 'admin' && firebaseUser?.tenantId === 'admin-master';

  // Subscribe to real-time data when tenant is available
  useEffect(() => {
    if (tenant?.id && !isAdmin) {
      console.log('Subscribing to real-time data for tenant:', tenant.id);
      subscribeToData();
    }
    
    return () => {
      console.log('Unsubscribing from real-time data');
      unsubscribeAll();
    };
  }, [tenant?.id]);

  const menuItems: { id: Module; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
    { id: 'produtos', label: 'Produtos e Serviços', icon: <Tags size={20} /> },
    { id: 'categorias', label: 'Categorias', icon: <Tags size={20} /> },
    { id: 'unidades', label: 'Unidades de Medida', icon: <Ruler size={20} /> },
    { id: 'estoque', label: 'Estoque', icon: <Package size={20} /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
    { id: 'faturamento', label: 'Faturamento', icon: <FileText size={20} /> },
    { id: 'pdv', label: 'PDV', icon: <ShoppingCart size={20} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <FileSpreadsheet size={20} /> },
    { id: 'operacional', label: 'Operacional', icon: <Wrench size={20} /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Truck size={20} /> },
    { id: 'funcionarios', label: 'Funcionários', icon: <Users size={20} /> },
    { id: 'parametros', label: 'Parâmetros', icon: <Settings size={20} /> },
    { id: 'admin', label: 'Painel Admin', icon: <Shield size={20} />, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Moderno */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 lg:z-auto w-64 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-transform lg:transition-all duration-300 flex flex-col shadow-lg h-full`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              GP
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GestãoPro</h1>
              <p className="text-xs text-slate-500">ERP SaaS Brasil</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="hover:bg-slate-100 lg:hidden">
            <X size={20} />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1 pb-4">
            {filteredMenuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentModule === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-11 ${
                  currentModule === item.id 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg' 
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => {
                  setModule(item.id);
                  setSidebarOpen(false); // Fechar em mobile
                }}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {tenant && (
            <div className="mb-3">
              <p className="font-medium text-sm truncate text-slate-700">{tenant.nome}</p>
              <Badge variant={tenant.status === 'ativo' ? 'default' : 'destructive'} className="text-xs mt-1 bg-gradient-to-r from-emerald-500 to-green-600">
                {tenant.plano.toUpperCase()}
              </Badge>
            </div>
          )}
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
            <LogOut size={20} />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(true)} 
                className="hover:bg-slate-100 lg:hidden"
              >
                <Menu size={24} />
              </Button>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {filteredMenuItems.find(i => i.id === currentModule)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon" className="relative hover:bg-slate-100">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-200">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md text-sm">
                  {user?.nome?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium block text-slate-700">{user?.nome || 'Usuário'}</span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {currentModule === 'dashboard' && <DashboardModule />}
          {currentModule === 'clientes' && <ClientesModule />}
          {currentModule === 'produtos' && <ProdutosServicosModule />}
          {currentModule === 'categorias' && <CategoriasModule />}
          {currentModule === 'unidades' && <UnidadesMedidaModule />}
          {currentModule === 'estoque' && <EstoqueModule />}
          {currentModule === 'financeiro' && <FinanceiroModule />}
          {currentModule === 'faturamento' && <FaturamentoModule />}
          {currentModule === 'pdv' && <PDVModule />}
          {currentModule === 'operacional' && <OperacionalModule />}
          {currentModule === 'pedidos' && <PedidosModule />}
          {currentModule === 'fornecedores' && <FornecedoresModule />}
          {currentModule === 'funcionarios' && <FuncionariosModule />}
          {currentModule === 'parametros' && <ParametrosModule />}
          {currentModule === 'admin' && <AdminModule />}
        </div>
      </main>
    </div>
  );
}

// ========== DASHBOARD MODULE ==========
function DashboardModule() {
  const { dashboardMetrics, produtos, contasPagar, contasReceber, ordensServico, pedidos } = useAppStore();

  const estoqueCritico = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo);
  const contasVencidas = [...contasPagar.filter(c => c.status === 'vencido'), ...contasReceber.filter(c => c.status === 'vencido')];
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente' || p.status === 'aprovado');

  return (
    <div className="space-y-6">
      {/* Métricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(dashboardMetrics.receitaMes)}
          icon={<TrendingUp className="text-emerald-500" />}
          change={`${dashboardMetrics.variacaoReceita}%`}
          changeType="positive"
          gradient="from-emerald-500 to-green-600"
        />
        <MetricCard
          title="Despesas do Mês"
          value={formatCurrency(dashboardMetrics.despesaMes)}
          icon={<TrendingDown className="text-red-500" />}
          change={`${dashboardMetrics.variacaoDespesa}%`}
          changeType="negative"
          gradient="from-red-500 to-rose-600"
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(dashboardMetrics.lucroMes)}
          icon={<DollarSign className="text-blue-500" />}
          change="+8.5%"
          changeType="positive"
          gradient="from-blue-500 to-indigo-600"
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={pedidosPendentes.length.toString()}
          icon={<FileSpreadsheet className="text-purple-500" />}
          change={`${pedidos.filter(p => p.status === 'pendente').length} novos`}
          changeType="positive"
          gradient="from-purple-500 to-violet-600"
        />
      </div>

      {/* Alertas */}
      {(estoqueCritico.length > 0 || contasVencidas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estoqueCritico.length > 0 && (
            <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>{estoqueCritico.length} produtos</strong> com estoque abaixo do mínimo
              </AlertDescription>
            </Alert>
          )}
          {contasVencidas.length > 0 && (
            <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{contasVencidas.length} contas</strong> vencidas pendentes
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-slate-800">Receitas vs Despesas</CardTitle>
            <CardDescription>Comparativo anual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="receita" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Receita" />
                <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-slate-800">Fluxo de Caixa</CardTitle>
            <CardDescription>Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fluxoCaixaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <AlertTriangle className="text-orange-500" size={20} />
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoqueCritico.slice(0, 5).map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-right text-red-600 font-bold">{produto.estoqueAtual}</TableCell>
                    <TableCell className="text-right">{produto.estoqueMinimo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileSpreadsheet className="text-blue-500" size={20} />
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosPendentes.slice(0, 5).map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">#{pedido.numero}</TableCell>
                    <TableCell>{pedido.nomeCliente}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pedido.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, change, changeType, gradient }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  change: string; 
  changeType: 'positive' | 'negative';
  gradient: string;
}) {
  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{value}</p>
            <p className={`text-sm mt-1 font-medium ${changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
              {change}
            </p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== CLIENTES MODULE ==========
function ClientesModule() {
  const { clientes, addCliente, updateClienteStore, deleteClienteStore } = useAppStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const filteredClientes = useMemo(() => {
    if (!search) return clientes;
    const termo = search.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.cpfCnpj.includes(search) ||
      c.email.toLowerCase().includes(termo)
    );
  }, [clientes, search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const cliente: Cliente = {
      id: editingCliente?.id || `cliente-${Date.now()}`,
      tenantId: '',
      nome: formData.get('nome') as string,
      cpfCnpj: formData.get('cpfCnpj') as string,
      email: formData.get('email') as string || '',
      telefone: formData.get('telefone') as string || '',
      endereco: {
        logradouro: formData.get('logradouro') as string || '',
        numero: formData.get('numero') as string || '',
        complemento: formData.get('complemento') as string || '',
        bairro: formData.get('bairro') as string || '',
        cidade: formData.get('cidade') as string || '',
        estado: formData.get('estado') as string || '',
        cep: formData.get('cep') as string || ''
      },
      observacoes: formData.get('observacoes') as string || '',
      ativo: true,
      tipoPessoa: (formData.get('cpfCnpj') as string)?.length > 11 ? 'juridica' : 'fisica'
    };

    if (editingCliente) {
      await updateClienteStore(editingCliente.id, cliente);
    } else {
      await addCliente(cliente);
    }
    setDialogOpen(false);
    setEditingCliente(null);
  };

  const clientesAtivos = clientes.filter(c => c.ativo).length;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-slate-800">{clientes.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{clientesAtivos}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{clientes.length - clientesAtivos}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <X size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome, CPF/CNPJ ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" onClick={() => setEditingCliente(null)}>
              <Plus size={18} className="mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar' : 'Novo'} Cliente</DialogTitle>
              <DialogDescription>Cadastre os dados do cliente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input name="nome" defaultValue={editingCliente?.nome} placeholder="Nome completo ou razão social" required />
                </div>
                <div>
                  <Label>CPF/CNPJ *</Label>
                  <Input name="cpfCnpj" defaultValue={editingCliente?.cpfCnpj} placeholder="000.000.000-00 ou 00.000.000/0000-00" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editingCliente?.email} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input name="telefone" defaultValue={editingCliente?.telefone} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <Separator />
              <h4 className="font-semibold text-slate-700">Endereço</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Logradouro</Label>
                  <Input name="logradouro" defaultValue={editingCliente?.endereco?.logradouro} placeholder="Rua, Avenida, etc." />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input name="numero" defaultValue={editingCliente?.endereco?.numero} placeholder="Nº" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Complemento</Label>
                  <Input name="complemento" defaultValue={editingCliente?.endereco?.complemento} placeholder="Apto, Sala, etc." />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input name="bairro" defaultValue={editingCliente?.endereco?.bairro} placeholder="Bairro" />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input name="cep" defaultValue={editingCliente?.endereco?.cep} placeholder="00000-000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input name="cidade" defaultValue={editingCliente?.endereco?.cidade} placeholder="Cidade" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input name="estado" defaultValue={editingCliente?.endereco?.estado} placeholder="UF" maxLength={2} />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea name="observacoes" defaultValue={editingCliente?.observacoes} placeholder="Observações gerais sobre o cliente" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell className="font-mono text-sm">{cliente.cpfCnpj}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>{cliente.telefone || '-'}</TableCell>
                  <TableCell>{cliente.endereco?.cidade || '-'}/{cliente.endereco?.estado || '-'}</TableCell>
                  <TableCell>
                    <Badge className={cliente.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCliente(cliente); setDialogOpen(true); }}><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => { if (confirm('Deseja excluir este cliente?')) deleteClienteStore(cliente.id); }}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== PRODUTOS E SERVIÇOS MODULE ==========
function ProdutosServicosModule() {
  const { produtos, categorias, fornecedores, unidadesMedida, addProduto, updateProduto, deleteProduto } = useAppStore();
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredProdutos = useMemo(() => {
    let result = produtos.filter(p => {
      const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || 
                          p.codigo.includes(search) ||
                          (p.codigoBarras && p.codigoBarras.includes(search));
      const matchCategoria = categoriaFilter === 'all' || p.categoriaId === categoriaFilter;
      const matchTipo = tipoFilter === 'all' || p.tipo === tipoFilter;
      return matchSearch && matchCategoria && matchTipo;
    });

    if (sort) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sort.key) {
          case 'nome': aVal = a.nome; bVal = b.nome; break;
          case 'codigo': aVal = a.codigo; bVal = b.codigo; break;
          case 'precoVenda': aVal = a.precoVenda; bVal = b.precoVenda; break;
          case 'estoqueAtual': aVal = a.estoqueAtual; bVal = b.estoqueAtual; break;
        }
        if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    return result;
  }, [produtos, search, categoriaFilter, tipoFilter, sort]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoriaValue = formData.get('categoria') as string;
    const fornecedorValue = formData.get('fornecedor') as string;
    const unidadeCompraValue = formData.get('unidadeCompra') as string;
    const unidadeVendaValue = formData.get('unidadeVenda') as string;
    
    const produto: Produto = {
      id: editingProduto?.id || `prod-${Date.now()}`,
      tenantId: '',
      codigo: formData.get('codigo') as string,
      codigoBarras: formData.get('codigoBarras') as string || undefined,
      nome: formData.get('nome') as string,
      descricao: formData.get('descricao') as string,
      tipo: (formData.get('tipo') as TipoItem) || 'produto',
      categoriaId: categoriaValue === 'sem-categoria' ? '' : categoriaValue,
      ncm: formData.get('ncm') as string,
      cst: formData.get('cst') as string,
      csosn: formData.get('csosn') as string || undefined,
      cfop: formData.get('cfop') as string,
      icms: parseFloat(formData.get('icms') as string) || undefined,
      pis: parseFloat(formData.get('pis') as string) || undefined,
      cofins: parseFloat(formData.get('cofins') as string) || undefined,
      unidade: formData.get('unidade') as string,
      // Unidades de medida e conversão
      unidadeCompra: unidadeCompraValue || undefined,
      unidadeVenda: unidadeVendaValue || undefined,
      fatorConversaoCompra: parseFloat(formData.get('fatorConversao') as string) || undefined,
      // Fornecedor
      fornecedorId: fornecedorValue === 'sem-fornecedor' ? undefined : fornecedorValue || undefined,
      codigoFornecedor: formData.get('codigoFornecedor') as string || undefined,
      precoCusto: Number(formData.get('precoCusto')),
      precoVenda: Number(formData.get('precoVenda')),
      estoqueAtual: Number(formData.get('estoqueAtual')) || 0,
      estoqueMinimo: Number(formData.get('estoqueMinimo')) || 0,
      atalhoPDV: formData.get('atalhoPDV') === 'on',
      ativo: true,
      dataCriacao: editingProduto?.dataCriacao || new Date(),
      dataAtualizacao: new Date()
    };

    if (editingProduto) {
      updateProduto(editingProduto.id, produto);
    } else {
      addProduto(produto);
    }
    setDialogOpen(false);
    setEditingProduto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Buscar por nome, código ou EAN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="produto">Produtos</SelectItem>
              <SelectItem value="servico">Serviços</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" onClick={() => setEditingProduto(null)}>
              <Plus size={18} className="mr-2" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto" key={editingProduto?.id || 'new'}>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduto ? 'Editar' : 'Novo'} Produto/Serviço</DialogTitle>
              <DialogDescription>Preencha os dados do produto ou serviço</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identificação */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Tags size={18} /> Identificação</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div><Label>Código *</Label><Input name="codigo" defaultValue={editingProduto?.codigo} required /></div>
                  <div className="col-span-2"><Label>Código de Barras (EAN)</Label><Input name="codigoBarras" defaultValue={editingProduto?.codigoBarras} placeholder="Ex: 7891234567890" /></div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select name="tipo" defaultValue={editingProduto?.tipo || 'produto'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Nome *</Label><Input name="nome" defaultValue={editingProduto?.nome} required className="text-lg" /></div>
                <div><Label>Descrição</Label><Textarea name="descricao" defaultValue={editingProduto?.descricao} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select name="categoria" defaultValue={editingProduto?.categoriaId || 'sem-categoria'}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                        {categorias.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select name="unidade" defaultValue={editingProduto?.unidade || 'UN'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="LT">Litro</SelectItem>
                        <SelectItem value="MT">Metro</SelectItem>
                        <SelectItem value="PC">Peça</SelectItem>
                        <SelectItem value="HR">Hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator />
              <h4 className="font-semibold text-slate-700">Dados Fiscais (NF-e)</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>NCM</Label><Input name="ncm" defaultValue={editingProduto?.ncm} placeholder="8 dígitos" /></div>
                <div><Label>CST</Label><Input name="cst" defaultValue={editingProduto?.cst} placeholder="Ex: 000" /></div>
                <div><Label>CSOSN</Label><Input name="csosn" defaultValue={editingProduto?.csosn} placeholder="Simples Nac." /></div>
                <div><Label>CFOP</Label><Input name="cfop" defaultValue={editingProduto?.cfop} placeholder="Ex: 5102" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>ICMS %</Label><Input name="icms" type="number" step="0.01" defaultValue={editingProduto?.icms} /></div>
                <div><Label>PIS %</Label><Input name="pis" type="number" step="0.01" defaultValue={editingProduto?.pis} /></div>
                <div><Label>COFINS %</Label><Input name="cofins" type="number" step="0.01" defaultValue={editingProduto?.cofins} /></div>
              </div>

              <Separator />
              <h4 className="font-semibold text-slate-700">Fornecedor e Conversão de Unidades</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <div className="min-w-0">
                  <Label>Fornecedor</Label>
                  <Select name="fornecedor" defaultValue={editingProduto?.fornecedorId || 'sem-fornecedor'} key={`forn-${editingProduto?.id || 'new'}`}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem-fornecedor">Sem fornecedor</SelectItem>
                      {fornecedores.filter(f => f.ativo).map((forn) => (
                        <SelectItem key={forn.id} value={forn.id}>{forn.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0">
                  <Label>Código no Fornecedor</Label>
                  <Input name="codigoFornecedor" defaultValue={editingProduto?.codigoFornecedor} placeholder="Código interno" className="w-full" />
                </div>
                <div className="min-w-0">
                  <Label>Unidade de Compra</Label>
                  <Select name="unidadeCompra" defaultValue={editingProduto?.unidadeCompra || ''} key={`unid-compra-${editingProduto?.id || 'new'}`}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.filter(u => u.ativo).map((uni) => (
                        <SelectItem key={uni.id} value={uni.sigla}>{uni.sigla} - {uni.nome}</SelectItem>
                      ))}
                      <SelectItem value="UN">UN - Unidade</SelectItem>
                      <SelectItem value="CX">CX - Caixa</SelectItem>
                      <SelectItem value="KG">KG - Quilograma</SelectItem>
                      <SelectItem value="LT">LT - Litro</SelectItem>
                      <SelectItem value="PC">PC - Peça</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0">
                  <Label>Unidade de Venda</Label>
                  <Select name="unidadeVenda" defaultValue={editingProduto?.unidadeVenda || ''} key={`unid-venda-${editingProduto?.id || 'new'}`}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.filter(u => u.ativo).map((uni) => (
                        <SelectItem key={uni.id} value={uni.sigla}>{uni.sigla} - {uni.nome}</SelectItem>
                      ))}
                      <SelectItem value="UN">UN - Unidade</SelectItem>
                      <SelectItem value="CX">CX - Caixa</SelectItem>
                      <SelectItem value="KG">KG - Quilograma</SelectItem>
                      <SelectItem value="LT">LT - Litro</SelectItem>
                      <SelectItem value="PC">PC - Peça</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fator de Conversão</Label>
                  <Input 
                    name="fatorConversao" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingProduto?.fatorConversaoCompra} 
                    placeholder="Ex: 12 (1 CX = 12 UN)" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Exemplo: Se compra por caixa com 12 unidades, digite 12</p>
                </div>
                <div className="flex items-end">
                  {editingProduto?.fatorConversaoCompra && editingProduto?.unidadeCompra && (
                    <div className="bg-blue-50 p-3 rounded-lg w-full">
                      <p className="text-sm text-blue-800">
                        <strong>Conversão:</strong> 1 {editingProduto.unidadeCompra} = {editingProduto.fatorConversaoCompra} {editingProduto.unidadeVenda || 'UN'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
              <h4 className="font-semibold text-slate-700">Preços e Estoque</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Preço Custo *</Label><Input name="precoCusto" type="number" step="0.01" defaultValue={editingProduto?.precoCusto} required /></div>
                <div><Label>Preço Venda *</Label><Input name="precoVenda" type="number" step="0.01" defaultValue={editingProduto?.precoVenda} required /></div>
                <div><Label>Estoque Atual</Label><Input name="estoqueAtual" type="number" defaultValue={editingProduto?.estoqueAtual} /></div>
                <div><Label>Estoque Mínimo</Label><Input name="estoqueMinimo" type="number" defaultValue={editingProduto?.estoqueMinimo} /></div>
              </div>

              <div className="flex items-center gap-2">
                <Switch name="atalhoPDV" defaultChecked={editingProduto?.atalhoPDV} />
                <Label>Exibir como atalho no PDV</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead><SortableHeader label="Código" sortKey="codigo" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Nome" sortKey="nome" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right"><SortableHeader label="Preço" sortKey="precoVenda" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Estoque" sortKey="estoqueAtual" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>PDV</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.map((produto) => {
                const categoria = categorias.find(c => c.id === produto.categoriaId);
                const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
                const estoqueBaixo = produto.tipo === 'produto' && produto.estoqueAtual <= produto.estoqueMinimo;
                return (
                  <TableRow key={produto.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <div className="flex gap-1 items-center">
                          {produto.codigoBarras && <p className="text-xs text-slate-500">EAN: {produto.codigoBarras}</p>}
                          {produto.fatorConversaoCompra && produto.unidadeCompra && (
                            <span className="text-xs text-blue-600 ml-2">
                              (1 {produto.unidadeCompra} = {produto.fatorConversaoCompra} {produto.unidadeVenda || 'UN'})
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={produto.tipo === 'servico' ? 'secondary' : 'default'} className={produto.tipo === 'servico' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                        {produto.tipo === 'servico' ? 'Serviço' : 'Produto'}
                      </Badge>
                    </TableCell>
                    <TableCell>{categoria && <Badge style={{ backgroundColor: categoria.cor, color: 'white' }}>{categoria.nome}</Badge>}</TableCell>
                    <TableCell>
                      {fornecedor ? (
                        <span className="text-sm">{fornecedor.nome}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(produto.precoVenda)}</TableCell>
                    <TableCell className="text-right">
                      {produto.tipo === 'produto' ? (
                        <span className={estoqueBaixo ? 'text-red-600 font-bold' : ''}>
                          {produto.estoqueAtual} {produto.unidade || 'UN'}
                          {estoqueBaixo && <AlertTriangle className="inline ml-1 text-orange-500" size={14} />}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{produto.atalhoPDV && <Badge className="bg-green-100 text-green-700">Atalho</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProduto(produto); setDialogOpen(true); }}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => deleteProduto(produto.id)}><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== ESTOQUE MODULE ==========
function EstoqueModule() {
  const { produtos, categorias, movimentarEstoque } = useAppStore();
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [tipoMov, setTipoMov] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'estoqueAtual', direction: 'asc' });

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const produtosEstoque = useMemo(() => {
    let result = produtos.filter(p => p.tipo === 'produto');
    
    // Filtro por busca
    if (search) {
      result = result.filter(p => 
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.includes(search) ||
        (p.codigoBarras && p.codigoBarras.includes(search))
      );
    }
    
    // Filtro por categoria
    if (categoriaFilter !== 'all') {
      result = result.filter(p => p.categoriaId === categoriaFilter);
    }
    
    // Filtro por status do estoque
    if (statusFilter !== 'all') {
      if (statusFilter === 'baixo') {
        result = result.filter(p => p.estoqueAtual > 0 && p.estoqueAtual <= p.estoqueMinimo);
      } else if (statusFilter === 'zerado') {
        result = result.filter(p => p.estoqueAtual === 0);
      } else if (statusFilter === 'normal') {
        result = result.filter(p => p.estoqueAtual > p.estoqueMinimo);
      }
    }

    if (sort) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sort.key) {
          case 'nome': aVal = a.nome; bVal = b.nome; break;
          case 'estoqueAtual': aVal = a.estoqueAtual; bVal = b.estoqueAtual; break;
          case 'estoqueMinimo': aVal = a.estoqueMinimo; bVal = b.estoqueMinimo; break;
        }
        if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    return result;
  }, [produtos, search, categoriaFilter, statusFilter, sort]);

  const estoqueBaixo = produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual > 0 && p.estoqueAtual <= p.estoqueMinimo);
  const estoqueZerado = produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual === 0);

  const handleMovimentar = () => {
    if (!selectedProduto || !motivo) return;
    movimentarEstoque(selectedProduto.id, tipoMov, quantidade, motivo);
    setDialogOpen(false);
    setSelectedProduto(null);
    setQuantidade(1);
    setMotivo('');
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Produtos</p>
                <p className="text-2xl font-bold text-slate-800">{produtosEstoque.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Package size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-600">{estoqueBaixo.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                <AlertTriangle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Estoque Zerado</p>
                <p className="text-2xl font-bold text-red-600">{estoqueZerado.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <Archive size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="baixo">Estoque Baixo</SelectItem>
            <SelectItem value="zerado">Zerado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Código</TableHead>
                <TableHead><SortableHeader label="Produto" sortKey="nome" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right"><SortableHeader label="Atual" sortKey="estoqueAtual" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Mínimo" sortKey="estoqueMinimo" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosEstoque.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhum produto encontrado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                produtosEstoque.map((produto) => {
                  const estoqueBaixoProd = produto.estoqueAtual <= produto.estoqueMinimo && produto.estoqueAtual > 0;
                  const categoria = categorias.find(c => c.id === produto.categoriaId);
                  return (
                    <TableRow key={produto.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono">{produto.codigo}</TableCell>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>
                        {categoria && (
                          <Badge style={{ backgroundColor: categoria.cor, color: 'white' }} className="text-xs">
                            {categoria.nome}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${estoqueBaixoProd || produto.estoqueAtual === 0 ? 'text-red-600' : ''}`}>
                        {produto.estoqueAtual}
                      </TableCell>
                      <TableCell className="text-right">{produto.estoqueMinimo}</TableCell>
                      <TableCell>
                        {produto.estoqueAtual === 0 ? (
                          <Badge className="bg-red-100 text-red-700">Zerado</Badge>
                        ) : estoqueBaixoProd ? (
                          <Badge className="bg-orange-100 text-orange-700">Baixo</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProduto(produto);
                            setDialogOpen(true);
                          }}
                        >
                          <ArrowRightLeft size={16} className="mr-1" /> Movimentar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
            <DialogDescription>{selectedProduto?.nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimentação</Label>
              <Select value={tipoMov} onValueChange={(v) => setTipoMov(v as typeof tipoMov)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (definir valor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} min={0} />
            </div>
            <div>
              <Label>Motivo *</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Compra fornecedor, Ajuste inventário..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={handleMovimentar} disabled={!motivo}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== FINANCEIRO MODULE ==========
function FinanceiroModule() {
  const { contasPagar, contasReceber, pagarConta, receberConta, addContaPagar, addContaReceber, clientes, fornecedores } = useAppStore();
  const [activeTab, setActiveTab] = useState('pagar');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<{ tipo: 'pagar' | 'receber'; id: string } | null>(null);
  const [dataBaixa, setDataBaixa] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [novaContaDialog, setNovaContaDialog] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'vencimento', direction: 'asc' });
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState<string>('all');
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>('all');

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Aplicar filtros
  const aplicarFiltros = useCallback(<T extends { vencimento: Date; status: string; descricao: string }>(lista: T[]) => {
    let result = [...lista];
    
    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Filtro por período
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      result = result.filter(item => new Date(item.vencimento) >= inicio);
    }
    if (dataFim) {
      const fim = new Date(dataFim);
      result = result.filter(item => new Date(item.vencimento) <= fim);
    }
    
    // Filtro por busca
    if (searchFilter) {
      result = result.filter(item => 
        item.descricao.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    return result;
  }, [statusFilter, dataInicio, dataFim, searchFilter]);

  const sortedContasPagar = useMemo(() => {
    const filtradas = aplicarFiltros(contasPagar);
    if (!sort) return filtradas;
    return [...filtradas].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      switch (sort.key) {
        case 'vencimento': aVal = new Date(a.vencimento); bVal = new Date(b.vencimento); break;
        case 'valor': aVal = a.valor; bVal = b.valor; break;
        case 'descricao': aVal = a.descricao; bVal = b.descricao; break;
      }
      if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [contasPagar, sort, aplicarFiltros]);

  const sortedContasReceber = useMemo(() => {
    const filtradas = aplicarFiltros(contasReceber);
    if (!sort) return filtradas;
    return [...filtradas].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      switch (sort.key) {
        case 'vencimento': aVal = new Date(a.vencimento); bVal = new Date(b.vencimento); break;
        case 'valor': aVal = a.valor; bVal = b.valor; break;
        case 'descricao': aVal = a.descricao; bVal = b.descricao; break;
      }
      if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [contasReceber, sort, aplicarFiltros]);

  // Gerar PDF
  const gerarPDF = () => {
    const titulo = activeTab === 'pagar' ? 'Contas a Pagar' : activeTab === 'receber' ? 'Contas a Receber' : 'Fluxo de Caixa';
    const dados = activeTab === 'pagar' ? sortedContasPagar : sortedContasReceber;
    
    // Criar conteúdo HTML para impressão
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titulo} - GestãoPro ERP</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; padding: 10px; background: #f3f4f6; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <p>Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        ${statusFilter !== 'all' ? `<p>Filtro Status: ${statusFilter}</p>` : ''}
        ${dataInicio ? `<p>Período: ${dataInicio} a ${dataFim || 'hoje'}</p>` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Data Baixa</th>
            </tr>
          </thead>
          <tbody>
            ${dados.map(item => `
              <tr>
                <td>${item.descricao}</td>
                <td>${formatCurrency(item.valor)}</td>
                <td>${formatDate(item.vencimento)}</td>
                <td>${item.status}</td>
                <td>${item.dataBaixa ? formatDate(item.dataBaixa) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          Total: ${formatCurrency(dados.reduce((acc, item) => acc + item.valor, 0))}
        </div>
        
        <div class="footer">
          GestãoPro ERP - Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </body>
      </html>
    `;
    
    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const limparFiltros = () => {
    setStatusFilter('all');
    setDataInicio('');
    setDataFim('');
    setSearchFilter('');
  };

  const totalPagar = contasPagar.filter(c => c.status === 'pendente' || c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
  const totalReceber = contasReceber.filter(c => c.status === 'pendente' || c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
  const saldoProjetado = totalReceber - totalPagar;

  const handleBaixa = () => {
    if (!selectedConta) return;
    const data = new Date(dataBaixa + 'T12:00:00');
    if (selectedConta.tipo === 'pagar') {
      pagarConta(selectedConta.id, data, formaPagamento);
    } else {
      receberConta(selectedConta.id, data, formaPagamento);
    }
    setDialogOpen(false);
    setSelectedConta(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
      case 'recebido':
        return <Badge className="bg-green-100 text-green-700">Pago</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total a Pagar</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPagar)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <TrendingDown size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total a Receber</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceber)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Saldo Projetado</p>
                <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoProjetado)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${saldoProjetado >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'} text-white shadow-lg`}>
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Buscar descrição..." 
                  value={searchFilter} 
                  onChange={(e) => setSearchFilter(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                type="date" 
                value={dataInicio} 
                onChange={(e) => setDataInicio(e.target.value)} 
                placeholder="Data Início"
                className="w-full sm:w-40"
              />
              <Input 
                type="date" 
                value={dataFim} 
                onChange={(e) => setDataFim(e.target.value)} 
                placeholder="Data Fim"
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <Button variant="outline" size="sm" onClick={limparFiltros} className="flex-1 lg:flex-none">
                <X size={16} className="mr-1" /> Limpar
              </Button>
              <Button variant="outline" size="sm" onClick={gerarPDF} className="flex-1 lg:flex-none">
                <FileText size={16} className="mr-1" /> PDF
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 flex-1 lg:flex-none" onClick={() => setNovaContaDialog(true)}>
                <Plus size={18} className="mr-2" /> Nova Conta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pagar">Contas a Pagar ({sortedContasPagar.length})</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber ({sortedContasReceber.length})</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="pagar" className="space-y-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead><SortableHeader label="Descrição" sortKey="descricao" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead className="text-right"><SortableHeader label="Valor" sortKey="valor" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead><SortableHeader label="Vencimento" sortKey="vencimento" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Baixa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContasPagar.map((conta) => (
                    <TableRow key={conta.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{formatDate(conta.vencimento)}</TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell>{conta.dataBaixa ? formatDate(conta.dataBaixa) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {(conta.status === 'pendente' || conta.status === 'vencido') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedConta({ tipo: 'pagar', id: conta.id });
                              setDialogOpen(true);
                            }}
                          >
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receber" className="space-y-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead><SortableHeader label="Descrição" sortKey="descricao" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead className="text-right"><SortableHeader label="Valor" sortKey="valor" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead><SortableHeader label="Vencimento" sortKey="vencimento" currentSort={sort} onSort={handleSort} /></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Baixa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContasReceber.map((conta) => (
                    <TableRow key={conta.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{formatDate(conta.vencimento)}</TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell>{conta.dataBaixa ? formatDate(conta.dataBaixa) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {(conta.status === 'pendente' || conta.status === 'vencido') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedConta({ tipo: 'receber', id: conta.id });
                              setDialogOpen(true);
                            }}
                          >
                            Receber
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Fluxo de Caixa - Últimas 4 Semanas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={fluxoCaixaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          {/* Filtros */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg">Filtros para Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Período Início</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
                <div>
                  <Label>Período Fim</Label>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Fornecedores</SelectItem>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relatório Contas a Receber por Cliente */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contas a Receber por Cliente</CardTitle>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-2" /> Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="text-right">Vencido</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => {
                    const contasCliente = contasReceber.filter(c => c.clienteId === cliente.id);
                    const pendente = contasCliente.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
                    const recebido = contasCliente.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor, 0);
                    const vencido = contasCliente.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
                    const total = pendente + recebido + vencido;
                    if (total === 0) return null;
                    return (
                      <TableRow key={cliente.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatCurrency(pendente)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(recebido)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(vencido)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-100 font-bold">
                    <TableCell>TOTAL GERAL</TableCell>
                    <TableCell className="text-right text-yellow-600">{formatCurrency(contasReceber.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(contasReceber.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(contasReceber.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(contasReceber.reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Relatório Contas a Pagar por Fornecedor */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contas a Pagar por Fornecedor</CardTitle>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-2" /> Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Vencido</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => {
                    const contasFornecedor = contasPagar.filter(c => c.fornecedorId === fornecedor.id);
                    const pendente = contasFornecedor.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
                    const pago = contasFornecedor.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0);
                    const vencido = contasFornecedor.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
                    const total = pendente + pago + vencido;
                    if (total === 0) return null;
                    return (
                      <TableRow key={fornecedor.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatCurrency(pendente)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(pago)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(vencido)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Contas sem fornecedor */}
                  {(() => {
                    const contasSemFornecedor = contasPagar.filter(c => !c.fornecedorId);
                    if (contasSemFornecedor.length === 0) return null;
                    const pendente = contasSemFornecedor.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
                    const pago = contasSemFornecedor.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0);
                    const vencido = contasSemFornecedor.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
                    const total = pendente + pago + vencido;
                    return (
                      <TableRow className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-500">Sem Fornecedor</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatCurrency(pendente)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(pago)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(vencido)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    );
                  })()}
                  <TableRow className="bg-slate-100 font-bold">
                    <TableCell>TOTAL GERAL</TableCell>
                    <TableCell className="text-right text-yellow-600">{formatCurrency(contasPagar.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(contasPagar.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(contasPagar.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(contasPagar.reduce((acc, c) => acc + c.valor, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Baixa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedConta?.tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data do {selectedConta?.tipo === 'pagar' ? 'Pagamento' : 'Recebimento'} *</Label>
              <Input type="date" value={dataBaixa} onChange={(e) => setDataBaixa(e.target.value)} />
            </div>
            <div>
              <Label>Forma de {selectedConta?.tipo === 'pagar' ? 'Pagamento' : 'Recebimento'}</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={handleBaixa}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Conta */}
      <Dialog open={novaContaDialog} onOpenChange={setNovaContaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const tipo = formData.get('tipo') as 'pagar' | 'receber';
            const conta = tipo === 'pagar' ? {
              id: `cp-${Date.now()}`,
              tenantId: '',
              descricao: formData.get('descricao') as string,
              valor: Number(formData.get('valor')),
              vencimento: new Date(formData.get('vencimento') as string),
              status: 'pendente' as const,
              categoria: formData.get('categoria') as string,
              observacoes: '',
              recorrente: false
            } : {
              id: `cr-${Date.now()}`,
              tenantId: '',
              descricao: formData.get('descricao') as string,
              valor: Number(formData.get('valor')),
              vencimento: new Date(formData.get('vencimento') as string),
              status: 'pendente' as const,
              categoria: formData.get('categoria') as string,
              observacoes: ''
            };
            if (tipo === 'pagar') {
              addContaPagar(conta as ContaPagar);
            } else {
              addContaReceber(conta as ContaReceber);
            }
            setNovaContaDialog(false);
          }} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue="pagar">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">Conta a Pagar</SelectItem>
                  <SelectItem value="receber">Conta a Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input name="descricao" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input name="valor" type="number" step="0.01" required />
              </div>
              <div>
                <Label>Vencimento *</Label>
                <Input name="vencimento" type="date" required />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input name="categoria" placeholder="Ex: Fornecedores, Serviços..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNovaContaDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== FATURAMENTO MODULE ==========
interface ProdutoImportado {
  codigo: string;
  descricao: string;
  ncm: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  adicionarEstoque: boolean;
  categoriaId?: string;
  atalhoPDV?: boolean;
}

interface DadosNotaImportada {
  numero: string;
  serie: string;
  chave: string;
  dataEmissao: Date;
  emitente: {
    nome: string;
    cnpj: string;
    ie?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  valorTotal: number;
  valorProdutos: number;
  produtos: ProdutoImportado[];
}

function FaturamentoModule() {
  const { notasFiscais, addNotaFiscal, fornecedores, addFornecedor, produtos, addProduto, updateProduto, movimentarEstoque, currentTenant, categorias, deleteNotaFiscal } = useAppStore();
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'dataEmissao', direction: 'desc' });
  const [importando, setImportando] = useState(false);
  const [dialogImportOpen, setDialogImportOpen] = useState(false);
  const [dialogFornecedorOpen, setDialogFornecedorOpen] = useState(false);
  const [dialogDetalheOpen, setDialogDetalheOpen] = useState(false);
  const [dadosNota, setDadosNota] = useState<DadosNotaImportada | null>(null);
  const [fornecedorExistente, setFornecedorExistente] = useState<Fornecedor | null>(null);
  const [novoFornecedor, setNovoFornecedor] = useState<Partial<Fornecedor>>({});
  const [notaDetalhe, setNotaDetalhe] = useState<NotaFiscal | null>(null);

  // Função para baixar XML
  const baixarXML = (nota: NotaFiscal) => {
    if (nota.xmlConteudo) {
      const blob = new Blob([nota.xmlConteudo], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFe_${nota.numero}_${nota.chave}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('XML não disponível para esta nota.');
    }
  };

  // Função para excluir nota
  const excluirNota = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      await deleteNotaFiscal(id);
    }
  };

  // Função para visualizar detalhes
  const visualizarDetalhes = (nota: NotaFiscal) => {
    setNotaDetalhe(nota);
    setDialogDetalheOpen(true);
  };

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedNotas = useMemo(() => {
    if (!sort) return notasFiscais;
    return [...notasFiscais].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      switch (sort.key) {
        case 'numero': aVal = a.numero; bVal = b.numero; break;
        case 'dataEmissao': aVal = new Date(a.dataEmissao); bVal = new Date(b.dataEmissao); break;
        case 'valorTotal': aVal = a.valorTotal; bVal = b.valorTotal; break;
        case 'emitente': aVal = a.emitente.nome; bVal = b.emitente.nome; break;
      }
      if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [notasFiscais, sort]);

  // Parser de XML
  const parseXML = (xmlContent: string): DadosNotaImportada | null => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const nfe = xmlDoc.getElementsByTagName('NFe')[0];
      if (!nfe) return null;
      
      const ide = nfe.getElementsByTagName('ide')[0];
      const emit = nfe.getElementsByTagName('emit')[0];
      const total = nfe.getElementsByTagName('total')[0];
      const detList = nfe.getElementsByTagName('det');
      
      // Dados do emitente
      const enderecoEmit = emit?.getElementsByTagName('enderEmit')[0];
      
      // Produtos
      const produtosList: ProdutoImportado[] = [];
      for (let i = 0; i < detList.length; i++) {
        const det = detList[i];
        const prod = det.getElementsByTagName('prod')[0];
        produtosList.push({
          codigo: prod?.getElementsByTagName('cProd')[0]?.textContent || '',
          descricao: prod?.getElementsByTagName('xProd')[0]?.textContent || '',
          ncm: prod?.getElementsByTagName('NCM')[0]?.textContent || '',
          quantidade: parseFloat(prod?.getElementsByTagName('qCom')[0]?.textContent || '0'),
          valorUnitario: parseFloat(prod?.getElementsByTagName('vUnCom')[0]?.textContent || '0'),
          valorTotal: parseFloat(prod?.getElementsByTagName('vProd')[0]?.textContent || '0'),
          adicionarEstoque: true
        });
      }
      
      return {
        numero: ide?.getElementsByTagName('nNF')[0]?.textContent || '',
        serie: ide?.getElementsByTagName('serie')[0]?.textContent || '',
        chave: '', // Extrair da assinatura se necessário
        dataEmissao: new Date(ide?.getElementsByTagName('dhEmi')[0]?.textContent || new Date()),
        emitente: {
          nome: emit?.getElementsByTagName('xNome')[0]?.textContent || '',
          cnpj: emit?.getElementsByTagName('CNPJ')[0]?.textContent || '',
          ie: emit?.getElementsByTagName('IE')[0]?.textContent || '',
          endereco: enderecoEmit ? {
            logradouro: enderecoEmit.getElementsByTagName('xLgr')[0]?.textContent || '',
            numero: enderecoEmit.getElementsByTagName('nro')[0]?.textContent || '',
            bairro: enderecoEmit.getElementsByTagName('xBairro')[0]?.textContent || '',
            cidade: enderecoEmit.getElementsByTagName('xMun')[0]?.textContent || '',
            estado: enderecoEmit.getElementsByTagName('UF')[0]?.textContent || '',
            cep: enderecoEmit.getElementsByTagName('CEP')[0]?.textContent || ''
          } : undefined
        },
        valorTotal: parseFloat(total?.getElementsByTagName('vNF')[0]?.textContent || '0'),
        valorProdutos: parseFloat(total?.getElementsByTagName('vProd')[0]?.textContent || '0'),
        produtos: produtosList
      };
    } catch (error) {
      console.error('Erro ao parsear XML:', error);
      return null;
    }
  };

  const handleImportXML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportando(true);
    try {
      const content = await file.text();
      const dados = parseXML(content);
      
      if (!dados) {
        alert('Não foi possível ler o arquivo XML. Verifique se é uma NF-e válida.');
        return;
      }
      
      setDadosNota(dados);
      
      // Verificar se o fornecedor já existe
      const cnpjLimpo = dados.emitente.cnpj.replace(/\D/g, '');
      const fornecedor = fornecedores.find(f => f.cnpj.replace(/\D/g, '') === cnpjLimpo);
      
      if (fornecedor) {
        setFornecedorExistente(fornecedor);
      } else {
        setFornecedorExistente(null);
        setNovoFornecedor({
          nome: dados.emitente.nome,
          cnpj: dados.emitente.cnpj,
          inscricaoEstadual: dados.emitente.ie,
          endereco: dados.emitente.endereco,
          email: '',
          telefone: '',
          contato: '',
          ativo: true
        });
      }
      
      setDialogImportOpen(true);
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      alert('Erro ao importar XML. Tente novamente.');
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!dadosNota) return;
    
    // Se não tem fornecedor, abrir dialog para cadastrar
    if (!fornecedorExistente && novoFornecedor) {
      setDialogFornecedorOpen(true);
      return;
    }
    
    await finalizarImportacao();
  };

  const handleSaveFornecedor = async () => {
    if (!novoFornecedor || !novoFornecedor.cnpj) return;
    
    const fornecedor: Fornecedor = {
      id: `forn-${Date.now()}`,
      tenantId: '',
      nome: novoFornecedor.nome || '',
      razaoSocial: novoFornecedor.razaoSocial,
      cnpj: novoFornecedor.cnpj,
      inscricaoEstadual: novoFornecedor.inscricaoEstadual,
      email: novoFornecedor.email || '',
      telefone: novoFornecedor.telefone || '',
      endereco: novoFornecedor.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
      contato: novoFornecedor.contato || '',
      ativo: true,
      dataCriacao: new Date()
    };
    
    try {
      const fornecedorId = await addFornecedor(fornecedor);
      setFornecedorExistente({ ...fornecedor, id: fornecedorId });
      setDialogFornecedorOpen(false);
      await finalizarImportacao();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor. Tente novamente.');
    }
  };

  const finalizarImportacao = async () => {
    if (!dadosNota || !currentTenant) {
      console.error('Dados da nota ou tenant não encontrados');
      return;
    }

    try {
      // Processar produtos e estoque
      for (const produto of dadosNota.produtos) {
        if (produto.adicionarEstoque) {
          // Verificar se produto existe pelo código
          const produtoExistente = produtos.find(p => p.codigo === produto.codigo);

          if (produtoExistente) {
            // Atualizar estoque e dados do fornecedor
            await movimentarEstoque(produtoExistente.id, 'entrada', produto.quantidade, `NF-e ${dadosNota.numero}`);
            // Atualizar dados do fornecedor se não tiver
            if (!produtoExistente.fornecedorId && fornecedorExistente) {
              await updateProduto(produtoExistente.id, {
                fornecedorId: fornecedorExistente.id,
                codigoFornecedor: produto.codigo
              });
            }
          } else {
            // Criar novo produto
            const novoProduto: Produto = {
              id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              tenantId: currentTenant.id,
              codigo: produto.codigo,
              nome: produto.descricao,
              descricao: produto.descricao,
              tipo: 'produto',
              categoriaId: produto.categoriaId || '',
              ncm: produto.ncm,
              cst: '000',
              cfop: '1102',
              unidade: 'UN',
              precoCusto: produto.valorUnitario,
              precoVenda: produto.valorUnitario * 1.3, // 30% de margem
              estoqueAtual: produto.quantidade,
              estoqueMinimo: 0,
              atalhoPDV: produto.atalhoPDV || false,
              ativo: true,
              dataCriacao: new Date(),
              dataAtualizacao: new Date(),
              fornecedorId: fornecedorExistente?.id,
              codigoFornecedor: produto.codigo // Código do produto no fornecedor (cProd do XML)
            };
            await addProduto(novoProduto);
          }
        }
      }

      // Criar a nota fiscal no Firebase
      const notaFiscal: NotaFiscal = {
        id: `nf-${Date.now()}`,
        tenantId: currentTenant.id,
        numero: dadosNota.numero,
        serie: dadosNota.serie,
        chave: dadosNota.chave,
        tipo: 'entrada',
        modelo: 'NF-e',
        emitente: {
          nome: dadosNota.emitente.nome,
          cnpj: dadosNota.emitente.cnpj,
          ie: dadosNota.emitente.ie,
          endereco: dadosNota.emitente.endereco || {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          }
        },
        destinatario: {
          nome: currentTenant.nome,
          cnpj: currentTenant.cnpj,
          ie: currentTenant.inscricaoEstadual || '',
          endereco: currentTenant.endereco
        },
        valorTotal: dadosNota.valorTotal,
        valorProdutos: dadosNota.valorProdutos,
        valorICMS: 0,
        valorPIS: 0,
        valorCOFINS: 0,
        dataEmissao: dadosNota.dataEmissao,
        xmlUrl: '',
        xmlConteudo: '',
        status: 'autorizada',
        produtos: dadosNota.produtos.map(p => ({
          codigo: p.codigo,
          nome: p.descricao,
          ncm: p.ncm,
          cfop: '1102',
          cst: '000',
          unidade: 'UN',
          quantidade: p.quantidade,
          valorUnitario: p.valorUnitario,
          valorTotal: p.valorTotal
        }))
      };

      await addNotaFiscal(notaFiscal);
      console.log('Nota fiscal importada com sucesso!');

      setDialogImportOpen(false);
      setDadosNota(null);
      setFornecedorExistente(null);
      setNovoFornecedor({});
    } catch (error) {
      console.error('Erro ao finalizar importação:', error);
      alert('Erro ao salvar a nota fiscal. Verifique o console para mais detalhes.');
    }
  };

  const toggleProdutoEstoque = (index: number) => {
    if (!dadosNota) return;
    const novosProdutos = [...dadosNota.produtos];
    novosProdutos[index].adicionarEstoque = !novosProdutos[index].adicionarEstoque;
    setDadosNota({ ...dadosNota, produtos: novosProdutos });
  };

  const toggleAllProdutosEstoque = (value: boolean) => {
    if (!dadosNota) return;
    setDadosNota({
      ...dadosNota,
      produtos: dadosNota.produtos.map(p => ({ ...p, adicionarEstoque: value }))
    });
  };

  const toggleProdutoPDV = (index: number) => {
    if (!dadosNota) return;
    const novosProdutos = [...dadosNota.produtos];
    novosProdutos[index].atalhoPDV = !novosProdutos[index].atalhoPDV;
    setDadosNota({ ...dadosNota, produtos: novosProdutos });
  };

  const updateProdutoCategoria = (index: number, categoriaId: string) => {
    if (!dadosNota) return;
    const novosProdutos = [...dadosNota.produtos];
    novosProdutos[index].categoriaId = categoriaId === 'sem-categoria' ? undefined : categoriaId;
    setDadosNota({ ...dadosNota, produtos: novosProdutos });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <Badge className="bg-green-100 text-green-700">Autorizada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      case 'rejeitada':
        return <Badge className="bg-orange-100 text-orange-700">Rejeitada</Badge>;
      case 'denegada':
        return <Badge className="bg-purple-100 text-purple-700">Denegada</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão importar */}
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Notas</p>
              <p className="text-xl font-bold text-slate-800">{notasFiscais.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Entradas</p>
              <p className="text-xl font-bold text-blue-600">{notasFiscais.filter(n => n.tipo === 'entrada').length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Saídas</p>
              <p className="text-xl font-bold text-green-600">{notasFiscais.filter(n => n.tipo === 'saida').length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="text-xl font-bold text-slate-800">
                {formatCurrency(notasFiscais.reduce((acc, n) => acc + n.valorTotal, 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <input
          type="file"
          accept=".xml"
          onChange={handleImportXML}
          className="hidden"
          id="xml-upload"
        />
        <label htmlFor="xml-upload">
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 cursor-pointer" asChild disabled={importando}>
            <span>
              <Upload size={18} className="mr-2" />
              {importando ? 'Importando...' : 'Importar XML'}
            </span>
          </Button>
        </label>
      </div>

      {/* Dialog de Confirmação de Importação */}
      <Dialog open={dialogImportOpen} onOpenChange={setDialogImportOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Importação de NF-e</DialogTitle>
            <DialogDescription>Verifique os dados da nota e configure os produtos para entrada no estoque</DialogDescription>
          </DialogHeader>

          {dadosNota && (
            <div className="space-y-4">
              {/* Dados da Nota */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dados da Nota Fiscal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Número</p>
                      <p className="font-semibold">{dadosNota.numero}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Série</p>
                      <p className="font-semibold">{dadosNota.serie}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Emissão</p>
                      <p className="font-semibold">{formatDate(dadosNota.dataEmissao)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Valor Total</p>
                      <p className="font-semibold text-green-600">{formatCurrency(dadosNota.valorTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Fornecedor */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Fornecedor</CardTitle>
                    {fornecedorExistente ? (
                      <Badge className="bg-green-100 text-green-700">Cadastrado</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">Novo - Será cadastrado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Nome</p>
                      <p className="font-semibold">{dadosNota.emitente.nome}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">CNPJ</p>
                      <p className="font-semibold font-mono">{dadosNota.emitente.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Inscrição Estadual</p>
                      <p className="font-semibold">{dadosNota.emitente.ie || '-'}</p>
                    </div>
                  </div>
                  {dadosNota.emitente.endereco && (
                    <p className="text-sm text-slate-600 mt-2">
                      {dadosNota.emitente.endereco.logradouro}, {dadosNota.emitente.endereco.numero} - {dadosNota.emitente.endereco.bairro}, {dadosNota.emitente.endereco.cidade}/{dadosNota.emitente.endereco.estado}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Produtos */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Produtos ({dadosNota.produtos.length})</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleAllProdutosEstoque(true)}>
                        Selecionar Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleAllProdutosEstoque(false)}>
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Est.</TableHead>
                        <TableHead className="w-10">PDV</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosNota.produtos.map((produto, index) => (
                        <TableRow key={index} className={produto.adicionarEstoque ? 'bg-green-50' : ''}>
                          <TableCell>
                            <Switch
                              checked={produto.adicionarEstoque}
                              onCheckedChange={() => toggleProdutoEstoque(index)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={produto.atalhoPDV || false}
                              onCheckedChange={() => toggleProdutoPDV(index)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{produto.codigo}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={produto.descricao}>{produto.descricao}</TableCell>
                          <TableCell>
                            <Select
                              value={produto.categoriaId || 'sem-categoria'}
                              onValueChange={(value) => updateProdutoCategoria(index, value)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                                {categorias.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">{produto.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(produto.valorUnitario)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(produto.valorTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogImportOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={handleConfirmImport}>
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro de Fornecedor */}
      <Dialog open={dialogFornecedorOpen} onOpenChange={setDialogFornecedorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
            <DialogDescription>Complete os dados do fornecedor para continuar a importação</DialogDescription>
          </DialogHeader>
          
          {novoFornecedor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Fantasia *</Label>
                  <Input value={novoFornecedor.nome || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })} />
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input value={novoFornecedor.cnpj || ''} disabled className="bg-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={novoFornecedor.email || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input value={novoFornecedor.telefone || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <Label>Contato Principal</Label>
                <Input value={novoFornecedor.contato || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, contato: e.target.value })} />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogFornecedorOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={handleSaveFornecedor}>
              Salvar e Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead><SortableHeader label="Número" sortKey="numero" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead><SortableHeader label="Emitente" sortKey="emitente" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Valor" sortKey="valorTotal" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Emissão" sortKey="dataEmissao" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNotas.map((nota) => (
                <TableRow key={nota.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">#{nota.numero}</TableCell>
                  <TableCell>{nota.serie}</TableCell>
                  <TableCell>
                    <Badge className={nota.tipo === 'entrada' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                      {nota.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{nota.emitente.nome}</p>
                      <p className="text-xs text-slate-500">{nota.emitente.cnpj}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(nota.valorTotal)}</TableCell>
                  <TableCell>{formatDate(nota.dataEmissao)}</TableCell>
                  <TableCell>{getStatusBadge(nota.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => setNotaDetalhe(nota)}><Eye size={16} /></Button>
                    <Button variant="ghost" size="icon" title="Baixar XML" onClick={() => baixarXML(nota)}><Download size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" title="Excluir" onClick={() => excluirNota(nota.id)}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== PDV MODULE ==========
interface Pagamento {
  id: string;
  forma: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
  valor: number;
}

interface MovimentacaoCaixa {
  id: string;
  tipo: 'abertura' | 'venda' | 'sangria' | 'reforco' | 'fechamento';
  valor: number;
  descricao: string;
  data: Date;
  formaPagamento?: string;
}

interface CaixaStatus {
  aberto: boolean;
  valorInicial: number;
  valorAtual: number;
  dataAbertura?: Date;
  movimentacoes: MovimentacaoCaixa[];
}

function PDVModule() {
  const { produtos, carrinho, addToCarrinho, removeFromCarrinho, updateCarrinhoItem, clearCarrinho, finalizarVenda, clientes } = useAppStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [novoPagamento, setNovoPagamento] = useState<Pagamento['forma']>('dinheiro');
  const [novoValor, setNovoValor] = useState<string>('');
  
  // Estado do Caixa
  const [caixa, setCaixa] = useState<CaixaStatus>(() => {
    const saved = localStorage.getItem('pdv-caixa');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        dataAbertura: parsed.dataAbertura ? new Date(parsed.dataAbertura) : undefined,
        movimentacoes: parsed.movimentacoes?.map((m: MovimentacaoCaixa) => ({ ...m, data: new Date(m.data) })) || []
      };
    }
    return { aberto: false, valorInicial: 0, valorAtual: 0, movimentacoes: [] };
  });
  const [dialogCaixaOpen, setDialogCaixaOpen] = useState(false);
  const [dialogMovimentacaoOpen, setDialogMovimentacaoOpen] = useState(false);
  const [valorAbertura, setValorAbertura] = useState<string>('');
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'sangria' | 'reforco'>('sangria');
  const [valorMovimentacao, setValorMovimentacao] = useState<string>('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState<string>('');

  // Salvar caixa no localStorage
  useEffect(() => {
    localStorage.setItem('pdv-caixa', JSON.stringify(caixa));
  }, [caixa]);

  // Funções do Caixa
  const abrirCaixa = () => {
    const valor = parseFloat(valorAbertura) || 0;
    const novaMovimentacao: MovimentacaoCaixa = {
      id: `mov-${Date.now()}`,
      tipo: 'abertura',
      valor,
      descricao: 'Abertura de caixa',
      data: new Date()
    };
    setCaixa({
      aberto: true,
      valorInicial: valor,
      valorAtual: valor,
      dataAbertura: new Date(),
      movimentacoes: [novaMovimentacao]
    });
    setValorAbertura('');
    setDialogCaixaOpen(false);
  };

  const fecharCaixa = () => {
    const novaMovimentacao: MovimentacaoCaixa = {
      id: `mov-${Date.now()}`,
      tipo: 'fechamento',
      valor: caixa.valorAtual,
      descricao: 'Fechamento de caixa',
      data: new Date()
    };
    setCaixa({
      aberto: false,
      valorInicial: 0,
      valorAtual: 0,
      movimentacoes: [...caixa.movimentacoes, novaMovimentacao]
    });
    setDialogCaixaOpen(false);
  };

  const registrarMovimentacao = () => {
    const valor = parseFloat(valorMovimentacao);
    if (isNaN(valor) || valor <= 0) return;
    
    const novaMovimentacao: MovimentacaoCaixa = {
      id: `mov-${Date.now()}`,
      tipo: tipoMovimentacao,
      valor,
      descricao: descricaoMovimentacao || (tipoMovimentacao === 'sangria' ? 'Sangria' : 'Reforço'),
      data: new Date()
    };
    
    setCaixa(prev => ({
      ...prev,
      valorAtual: tipoMovimentacao === 'sangria' ? prev.valorAtual - valor : prev.valorAtual + valor,
      movimentacoes: [...prev.movimentacoes, novaMovimentacao]
    }));
    
    setValorMovimentacao('');
    setDescricaoMovimentacao('');
    setDialogMovimentacaoOpen(false);
  };

  // Produtos com atalho PDV
  const produtosAtalho = produtos.filter(p => p.atalhoPDV && p.ativo && (p.tipo === 'produto' ? p.estoqueAtual > 0 : true));

  // Busca de produtos
  const produtosBusca = useMemo(() => {
    if (!search) return [];
    const termo = search.toLowerCase();
    return produtos.filter(p => 
      p.ativo &&
      (p.nome.toLowerCase().includes(termo) || 
       p.codigo.includes(search) ||
       (p.codigoBarras && p.codigoBarras.includes(search)))
    ).slice(0, 10);
  }, [produtos, search]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.produto.precoVenda * item.quantidade), 0);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const saldoRestante = totalCarrinho - totalPago;
  const troco = totalPago > totalCarrinho ? totalPago - totalCarrinho : 0;

  const adicionarPagamento = () => {
    const valor = parseFloat(novoValor);
    if (isNaN(valor) || valor <= 0) return;
    
    // Para dinheiro, permite valor maior que o restante (para troco)
    // Para outras formas, limita ao saldo restante
    const valorFinal = novoPagamento === 'dinheiro' ? valor : Math.min(valor, saldoRestante);
    
    setPagamentos(prev => [...prev, {
      id: `pag-${Date.now()}`,
      forma: novoPagamento,
      valor: valorFinal
    }]);
    setNovoValor('');
    setNovoPagamento('dinheiro');
  };

  const removerPagamento = (id: string) => {
    setPagamentos(prev => prev.filter(p => p.id !== id));
  };

  const handleFinalizar = async () => {
    // Se há valor no campo mas não foi adicionado, adiciona automaticamente
    if (novoValor && parseFloat(novoValor) > 0 && pagamentos.length === 0) {
      const valor = parseFloat(novoValor);
      if (!isNaN(valor) && valor > 0) {
        const valorFinal = novoPagamento === 'dinheiro' ? valor : Math.min(valor, totalCarrinho);
        setPagamentos([{ id: `pag-${Date.now()}`, forma: novoPagamento, valor: valorFinal }]);
        // Aguarda o state atualizar antes de continuar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Verifica se o pagamento está completo
    const pagamentosAtuais = pagamentos.length > 0 ? pagamentos : 
      (novoValor && parseFloat(novoValor) > 0 ? [{ id: `pag-${Date.now()}`, forma: novoPagamento, valor: parseFloat(novoValor) }] : []);
    
    const totalPagoAtual = pagamentosAtuais.reduce((acc, p) => acc + p.valor, 0);
    if (totalPagoAtual < totalCarrinho) return; // Não permite finalizar se não pagou tudo
    
    // Combinar formas de pagamento
    const formasPagamento = pagamentosAtuais.map(p => p.forma).join(', ');
    await finalizarVenda(formasPagamento, clienteId || undefined);
    
    // Registrar venda no caixa
    pagamentosAtuais.forEach(pag => {
      const movimentacao: MovimentacaoCaixa = {
        id: `mov-${Date.now()}-${pag.id}`,
        tipo: 'venda',
        valor: pag.valor,
        descricao: `Venda - ${getFormaPagamentoLabel(pag.forma)}`,
        data: new Date(),
        formaPagamento: pag.forma
      };
      setCaixa(prev => ({
        ...prev,
        valorAtual: prev.valorAtual + pag.valor,
        movimentacoes: [...prev.movimentacoes, movimentacao]
      }));
    });
    
    setDialogOpen(false);
    clearCarrinho();
    setClienteId(null);
    setPagamentos([]);
    setNovoValor('');
  };

  const abrirFinalizacao = () => {
    // Iniciar com o valor total já preenchido
    setPagamentos([]);
    setNovoPagamento('dinheiro');
    setNovoValor(totalCarrinho.toFixed(2)); // Já preenche com o total
    setDialogOpen(true);
  };

  const getFormaPagamentoLabel = (forma: Pagamento['forma']) => {
    const labels: Record<Pagamento['forma'], string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito'
    };
    return labels[forma];
  };

  return (
    <div className="space-y-4">
      {/* Status do Caixa */}
      <Card className={`shadow-lg border-0 ${caixa.aberto ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={24} />
              <div>
                <p className="font-semibold">{caixa.aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</p>
                {caixa.aberto && (
                  <p className="text-sm opacity-90">Saldo: {formatCurrency(caixa.valorAtual)}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {caixa.aberto ? (
                <>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setDialogMovimentacaoOpen(true)}
                  >
                    <Plus size={16} className="mr-1" /> Movimentação
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => setDialogCaixaOpen(true)}
                  >
                    Fechar Caixa
                  </Button>
                </>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setDialogCaixaOpen(true)}
                >
                  Abrir Caixa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Buscar por nome ou código de barras..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 h-12 text-lg"
            />
            {/* Resultados da busca */}
            {search && produtosBusca.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-20 mt-1 shadow-xl">
                <CardContent className="p-2 max-h-64 overflow-y-auto">
                  {produtosBusca.map((produto) => (
                    <button
                      key={produto.id}
                      className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg"
                      onClick={() => {
                        addToCarrinho(produto, 1);
                      setSearch('');
                    }}
                  >
                    <div className="text-left">
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-slate-500">{produto.codigo} {produto.codigoBarras && `• EAN: ${produto.codigoBarras}`}</p>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(produto.precoVenda)}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Atalhos PDV */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Atalhos</h3>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
            {produtosAtalho.map((produto) => (
              <Button
                key={produto.id}
                variant="outline"
                className="h-12 flex flex-col items-center justify-center px-1 py-1 border hover:border-blue-500 hover:bg-blue-50"
                style={{ borderColor: produto.corPDV || undefined }}
                onClick={() => addToCarrinho(produto, 1)}
              >
                <span className="text-[10px] font-medium truncate w-full text-center leading-tight">{produto.nome}</span>
                <span className="text-[11px] font-bold text-green-600">{formatCurrency(produto.precoVenda)}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Lista completa de produtos */}
        <Card className="shadow-lg border-0 flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Produtos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.filter(p => p.ativo && (p.tipo === 'produto' ? p.estoqueAtual > 0 : true)).slice(0, 20).map((produto) => (
                  <TableRow 
                    key={produto.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => addToCarrinho(produto, 1)}
                  >
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(produto.precoVenda)}</TableCell>
                    <TableCell className="text-right">{produto.tipo === 'produto' ? produto.estoqueAtual : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Carrinho */}
      <div className="flex flex-col">
        <Card className="shadow-lg border-0 flex-1 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={20} /> Carrinho
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {carrinho.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShoppingCart size={48} />
                <p className="mt-2">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrinho.map((item) => (
                  <div key={item.produto.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.produto.nome}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.produto.precoVenda)} x {item.quantidade}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateCarrinhoItem(item.produto.id, Math.max(1, item.quantidade - 1))}
                      >-</Button>
                      <span className="font-bold">{item.quantidade}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateCarrinhoItem(item.produto.id, item.quantidade + 1)}
                      >+</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-600"
                        onClick={() => removeFromCarrinho(item.produto.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(totalCarrinho)}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={clearCarrinho}
                disabled={carrinho.length === 0}
              >
                Limpar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600" 
                onClick={abrirFinalizacao}
                disabled={carrinho.length === 0}
              >
                Finalizar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    {/* Dialog Finalização com Múltiplas Formas de Pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Total da venda: <strong className="text-green-600">{formatCurrency(totalCarrinho)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Cliente */}
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={clienteId || 'consumidor'} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumidor">Consumidor Final</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Pagamentos */}
            <div>
              <Label className="text-base font-semibold">Formas de Pagamento</Label>
              
              {/* Total a pagar */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-3">
                <span className="font-medium text-blue-800">Total a Pagar:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(totalCarrinho)}</span>
              </div>
              
              {/* Lista de pagamentos adicionados */}
              {pagamentos.length > 0 && (
                <div className="space-y-2 mb-3">
                  {pagamentos.map((pag) => (
                    <div key={pag.id} className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        {pag.forma === 'dinheiro' && <Banknote size={18} className="text-green-600" />}
                        {pag.forma === 'pix' && <CreditCard size={18} className="text-purple-600" />}
                        {(pag.forma === 'cartao_credito' || pag.forma === 'cartao_debito') && <CreditCard size={18} className="text-blue-600" />}
                        <span className="font-medium">{getFormaPagamentoLabel(pag.forma)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">{formatCurrency(pag.valor)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500"
                          onClick={() => removerPagamento(pag.id)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar novo pagamento */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={novoPagamento} onValueChange={(v) => setNovoPagamento(v as Pagamento['forma'])}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={saldoRestante > 0 ? formatCurrency(saldoRestante) : "0,00"}
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    className="flex-1"
                    disabled={saldoRestante <= 0}
                  />
                  <Button 
                    onClick={adicionarPagamento} 
                    variant="outline"
                    disabled={saldoRestante <= 0}
                  >
                    <Plus size={18} />
                  </Button>
                </div>
                {saldoRestante > 0 && (
                  <p className="text-sm text-slate-500">
                    Saldo restante: <strong className="text-orange-600">{formatCurrency(saldoRestante)}</strong>
                  </p>
                )}
              </div>

              {/* Troco */}
              {troco > 0 && (
                <Alert className="bg-green-50 border-green-200 mt-3">
                  <AlertDescription className="text-green-800">
                    <strong>Troco: {formatCurrency(troco)}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600" 
                onClick={handleFinalizar}
                disabled={saldoRestante > 0 && (!novoValor || parseFloat(novoValor) < saldoRestante) && pagamentos.length === 0}
              >
                Confirmar Venda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Abrir/Fechar Caixa */}
      <Dialog open={dialogCaixaOpen} onOpenChange={setDialogCaixaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{caixa.aberto ? 'Fechar Caixa' : 'Abrir Caixa'}</DialogTitle>
          </DialogHeader>
          {caixa.aberto ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Valor Inicial:</span>
                  <span className="font-bold">{formatCurrency(caixa.valorInicial)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendas do Dia:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(caixa.movimentacoes.filter(m => m.tipo === 'venda').reduce((acc, m) => acc + m.valor, 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Saldo Final:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(caixa.valorAtual)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogCaixaOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={fecharCaixa}>Fechar Caixa</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Valor Inicial do Caixa</Label>
                <Input 
                  type="number" 
                  value={valorAbertura} 
                  onChange={(e) => setValorAbertura(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogCaixaOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={abrirCaixa}>Abrir Caixa</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Movimentação de Caixa */}
      <Dialog open={dialogMovimentacaoOpen} onOpenChange={setDialogMovimentacaoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Movimentação de Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={tipoMovimentacao === 'sangria' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTipoMovimentacao('sangria')}
              >
                <ArrowDownCircle size={18} className="mr-2" /> Sangria
              </Button>
              <Button 
                variant={tipoMovimentacao === 'reforco' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTipoMovimentacao('reforco')}
              >
                <ArrowUpCircle size={18} className="mr-2" /> Reforço
              </Button>
            </div>
            <div>
              <Label>Valor</Label>
              <Input 
                type="number" 
                value={valorMovimentacao} 
                onChange={(e) => setValorMovimentacao(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input 
                value={descricaoMovimentacao} 
                onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                placeholder={tipoMovimentacao === 'sangria' ? 'Ex: Pagamento de fornecedor' : 'Ex: Troco adicional'}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogMovimentacaoOpen(false)}>Cancelar</Button>
              <Button 
                className="flex-1" 
                onClick={registrarMovimentacao}
                disabled={!valorMovimentacao || parseFloat(valorMovimentacao) <= 0}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== PEDIDOS MODULE ==========
function PedidosModule() {
  const { pedidos, aprovarPedido, cancelarPedido, produtos, clientes, addToCarrinho, setModule, clearCarrinho } = useAppStore();
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'dataCriacao', direction: 'desc' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPedidos = useMemo(() => {
    if (!sort) return pedidos;
    return [...pedidos].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      switch (sort.key) {
        case 'numero': aVal = a.numero; bVal = b.numero; break;
        case 'nomeCliente': aVal = a.nomeCliente || ''; bVal = b.nomeCliente || ''; break;
        case 'total': aVal = a.total; bVal = b.total; break;
        case 'dataCriacao': aVal = new Date(a.dataCriacao); bVal = new Date(b.dataCriacao); break;
        case 'status': aVal = a.status; bVal = b.status; break;
      }
      if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [pedidos, sort]);

  // Cards resumo
  const pendentes = pedidos.filter(p => p.status === 'pendente');
  const aprovados = pedidos.filter(p => p.status === 'aprovado');
  const totalPendentes = pendentes.reduce((acc, p) => acc + p.total, 0);
  const totalAprovados = aprovados.reduce((acc, p) => acc + p.total, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-blue-100 text-blue-700">Aprovado</Badge>;
      case 'convertido':
        return <Badge className="bg-green-100 text-green-700">Convertido</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleConverterParaPDV = () => {
    if (!selectedPedido) return;
    
    // Limpar carrinho atual
    clearCarrinho();
    
    // Adicionar itens do pedido ao carrinho
    selectedPedido.itens.forEach(item => {
      const produto = produtos.find(p => p.id === item.produtoId);
      if (produto) {
        addToCarrinho(produto, item.quantidade);
      }
    });
    
    // Fechar dialog e ir para PDV
    setDialogOpen(false);
    setSelectedPedido(null);
    setModule('pdv');
  };

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Pedidos</p>
                <p className="text-2xl font-bold text-slate-800">{pedidos.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <FileSpreadsheet size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendentes.length}</p>
                <p className="text-sm text-slate-500">{formatCurrency(totalPendentes)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
                <Clock size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Aprovados</p>
                <p className="text-2xl font-bold text-blue-600">{aprovados.length}</p>
                <p className="text-sm text-slate-500">{formatCurrency(totalAprovados)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(pedidos.reduce((acc, p) => acc + p.total, 0))}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead><SortableHeader label="Nº" sortKey="numero" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Cliente" sortKey="nomeCliente" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Total" sortKey="total" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Data" sortKey="dataCriacao" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Status" sortKey="status" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Cond. Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPedidos.map((pedido) => (
                <TableRow key={pedido.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">#{pedido.numero}</TableCell>
                  <TableCell>{pedido.nomeCliente || 'Consumidor Final'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(pedido.total)}</TableCell>
                  <TableCell>{formatDate(pedido.dataCriacao)}</TableCell>
                  <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                  <TableCell>{pedido.condicaoPagamento}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {pedido.status === 'pendente' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => aprovarPedido(pedido.id)}>
                            <CheckCircle size={14} className="mr-1" /> Aprovar
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => cancelarPedido(pedido.id)}>
                            Cancelar
                          </Button>
                        </>
                      )}
                      {pedido.status === 'aprovado' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600"
                          onClick={() => {
                            setSelectedPedido(pedido);
                            setDialogOpen(true);
                          }}
                        >
                          Converter em Venda
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Conversão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Pedido em Venda</DialogTitle>
            <DialogDescription>
              Pedido #{selectedPedido?.numero} - Total: {selectedPedido && formatCurrency(selectedPedido.total)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Ao continuar, você será redirecionado para o PDV onde poderá selecionar as formas de pagamento e finalizar a venda.
            </p>
            {selectedPedido && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Itens do pedido:</p>
                <ul className="text-sm text-slate-600 mt-2 space-y-1">
                  {selectedPedido.itens.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.quantidade}x {item.descricao || `Produto ${item.produtoId}`}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600" 
                onClick={handleConverterParaPDV}
              >
                <ShoppingCart size={16} className="mr-2" />
                Ir para PDV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== OPERACIONAL MODULE ==========
function OperacionalModule() {
  const { ordensServico, clientes, addOrdemServico, updateOrdemServico, deleteOrdemServico, converterOSEmVenda, toggleOSAtivo } = useAppStore();
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'dataAbertura', direction: 'desc' });
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [converterDialog, setConverterDialog] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [novaOSDialog, setNovaOSDialog] = useState(false);
  const [parcelas, setParcelas] = useState<{ numero: number; valor: number; vencimento: Date }[]>([]);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const ordensFiltradas = useMemo(() => {
    let result = mostrarInativos ? ordensServico : ordensServico.filter(os => os.ativo !== false);
    
    if (sort) {
      result = [...result].sort((a, b) => {
        let aVal: string | number | Date = '';
        let bVal: string | number | Date = '';
        switch (sort.key) {
          case 'numero': aVal = a.numero; bVal = b.numero; break;
          case 'cliente': aVal = a.cliente?.nome || ''; bVal = b.cliente?.nome || ''; break;
          case 'valorTotal': aVal = a.valorTotal; bVal = b.valorTotal; break;
          case 'dataAbertura': aVal = new Date(a.dataAbertura); bVal = new Date(b.dataAbertura); break;
          case 'status': aVal = a.status; bVal = b.status; break;
        }
        if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    return result;
  }, [ordensServico, mostrarInativos, sort]);

  // Cards resumo
  const abertas = ordensServico.filter(os => os.ativo !== false && os.status === 'aberta');
  const emAndamento = ordensServico.filter(os => os.ativo !== false && os.status === 'em_andamento');
  const aprovadas = ordensServico.filter(os => os.ativo !== false && os.status === 'aprovada');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta':
        return <Badge className="bg-yellow-100 text-yellow-700">Aberta</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-700">Em Andamento</Badge>;
      case 'concluida':
        return <Badge className="bg-green-100 text-green-700">Concluída</Badge>;
      case 'aprovada':
        return <Badge className="bg-purple-100 text-purple-700">Aprovada</Badge>;
      case 'convertida':
        return <Badge className="bg-emerald-100 text-emerald-700">Convertida</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleConverter = () => {
    if (!selectedOS || parcelas.length === 0) return;
    converterOSEmVenda(selectedOS.id, parcelas);
    setConverterDialog(false);
    setSelectedOS(null);
    setParcelas([]);
  };

  const initParcelas = (os: OrdemServico) => {
    setParcelas([{
      numero: 1,
      valor: os.valorTotal,
      vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }]);
  };

  const addParcela = () => {
    const newNumero = parcelas.length + 1;
    const valorParcela = selectedOS ? selectedOS.valorTotal / newNumero : 0;
    const novasParcelas = parcelas.map(p => ({ ...p, valor: valorParcela }));
    novasParcelas.push({
      numero: newNumero,
      valor: valorParcela,
      vencimento: new Date(Date.now() + newNumero * 30 * 24 * 60 * 60 * 1000)
    });
    setParcelas(novasParcelas);
  };

  const removeParcela = (index: number) => {
    const novasParcelas = parcelas.filter((_, i) => i !== index);
    const valorParcela = selectedOS ? selectedOS.valorTotal / novasParcelas.length : 0;
    setParcelas(novasParcelas.map((p, i) => ({ ...p, numero: i + 1, valor: valorParcela })));
  };

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Abertas</p>
                <p className="text-2xl font-bold text-yellow-600">{abertas.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
                <Clock size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{emAndamento.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                <Wrench size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Aprovadas</p>
                <p className="text-2xl font-bold text-purple-600">{aprovadas.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(ordensServico.reduce((acc, os) => acc + os.valorTotal, 0))}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Mostrar Inativos</span>
          <Switch checked={mostrarInativos} onCheckedChange={setMostrarInativos} />
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => setNovaOSDialog(true)}>
          <Plus size={18} className="mr-2" /> Nova OS
        </Button>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead><SortableHeader label="Nº" sortKey="numero" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Cliente" sortKey="cliente" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right"><SortableHeader label="Valor" sortKey="valorTotal" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Abertura" sortKey="dataAbertura" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Status" sortKey="status" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordensFiltradas.map((os) => (
                <TableRow key={os.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">#{os.numero}</TableCell>
                  <TableCell>{os.cliente?.nome || 'Cliente'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{os.descricao}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(os.valorTotal)}</TableCell>
                  <TableCell>{formatDate(os.dataAbertura)}</TableCell>
                  <TableCell>{getStatusBadge(os.status)}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={os.ativo !== false} 
                      onCheckedChange={() => toggleOSAtivo(os.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {os.status === 'aprovada' && os.ativo !== false && (
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600"
                          onClick={() => {
                            setSelectedOS(os);
                            initParcelas(os);
                            setConverterDialog(true);
                          }}
                        >
                          Converter em Venda
                        </Button>
                      )}
                      {os.status === 'aberta' && (
                        <Button variant="outline" size="sm" onClick={() => updateOrdemServico(os.id, { status: 'em_andamento' })}>
                          Iniciar
                        </Button>
                      )}
                      {os.status === 'em_andamento' && (
                        <Button variant="outline" size="sm" onClick={() => updateOrdemServico(os.id, { status: 'concluida' })}>
                          Concluir
                        </Button>
                      )}
                      {os.status === 'concluida' && (
                        <Button variant="outline" size="sm" onClick={() => updateOrdemServico(os.id, { status: 'aprovada' })}>
                          Aprovar
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteOrdemServico(os.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Converter em Venda */}
      <Dialog open={converterDialog} onOpenChange={setConverterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Converter OS em Venda</DialogTitle>
            <DialogDescription>
              OS #{selectedOS?.numero} - Total: {selectedOS && formatCurrency(selectedOS.valorTotal)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Parcelas</Label>
              <Button variant="outline" size="sm" onClick={addParcela}>
                <Plus size={14} className="mr-1" /> Adicionar Parcela
              </Button>
            </div>
            {parcelas.map((parcela, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Nº</Label>
                  <Input value={parcela.numero} disabled className="w-16" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Valor</Label>
                  <Input 
                    type="number" 
                    value={parcela.valor} 
                    onChange={(e) => {
                      const novas = [...parcelas];
                      novas[index].valor = Number(e.target.value);
                      setParcelas(novas);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Vencimento</Label>
                  <Input 
                    type="date" 
                    value={format(parcela.vencimento, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const novas = [...parcelas];
                      novas[index].vencimento = new Date(e.target.value + 'T12:00:00');
                      setParcelas(novas);
                    }}
                  />
                </div>
                {parcelas.length > 1 && (
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => removeParcela(index)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setConverterDialog(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600" onClick={handleConverter}>
                Confirmar Conversão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova OS */}
      <Dialog open={novaOSDialog} onOpenChange={setNovaOSDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const clienteId = formData.get('cliente') as string;
            const cliente = clientes.find(c => c.id === clienteId);
            const os: OrdemServico = {
              id: `os-${Date.now()}`,
              tenantId: '',
              numero: ordensServico.length + 1001,
              cliente: cliente || {} as Cliente,
              clienteId,
              descricao: formData.get('descricao') as string,
              servicos: [{ descricao: formData.get('descricao') as string, quantidade: 1, valorUnitario: Number(formData.get('valor')), total: Number(formData.get('valor')) }],
              valorServicos: Number(formData.get('valor')),
              valorProdutos: 0,
              valorTotal: Number(formData.get('valor')),
              status: 'aberta',
              ativo: true,
              dataAbertura: new Date(),
              observacoes: formData.get('observacoes') as string
            };
            addOrdemServico(os);
            setNovaOSDialog(false);
          }} className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select name="cliente" required>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Textarea name="descricao" required />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input name="valor" type="number" step="0.01" required />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea name="observacoes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNovaOSDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== PARAMETROS MODULE ==========
function ParametrosModule() {
  const { bancos, impressoras, addBanco, updateBanco, deleteBanco, addImpressora, updateImpressora, deleteImpressora } = useAppStore();
  const [activeTab, setActiveTab] = useState('certificado');
  const [bancoDialog, setBancoDialog] = useState(false);
  const [impressoraDialog, setImpressoraDialog] = useState(false);
  const [editingBanco, setEditingBanco] = useState<ConfigBanco | null>(null);
  const [editingImpressora, setEditingImpressora] = useState<ConfigImpressora | null>(null);

  // Impostos padrão
  const [impostos, setImpostos] = useState({
    icms: 18,
    pis: 1.65,
    cofins: 7.6,
    ipi: 0
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="impressoras">Impressoras</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
        </TabsList>

        {/* Certificado Digital */}
        <TabsContent value="certificado">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} /> Certificado Digital
              </CardTitle>
              <CardDescription>
                Configure seu certificado digital para emissão de NF-e/NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input type="file" accept=".pfx,.p12" className="hidden" id="cert-upload" />
                <label htmlFor="cert-upload" className="cursor-pointer">
                  <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-600">Clique para fazer upload do certificado</p>
                  <p className="text-sm text-slate-400 mt-1">Formatos aceitos: .pfx, .p12</p>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Senha do Certificado</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" />
                </div>
              </div>
              <Alert>
                <AlertTriangle size={16} />
                <AlertDescription>
                  O certificado digital é armazenado de forma segura e criptografada. Mantenha seu certificado atualizado para evitar problemas na emissão de notas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bancos */}
        <TabsContent value="bancos">
          <Card className="shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Banknote size={20} /> Contas Bancárias
                </CardTitle>
                <CardDescription>
                  Configure suas contas para integração bancária e boletos
                </CardDescription>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => { setEditingBanco(null); setBancoDialog(true); }}>
                <Plus size={18} className="mr-2" /> Novo Banco
              </Button>
            </CardHeader>
            <CardContent>
              {bancos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Banknote size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conta bancária configurada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bancos.map((banco) => (
                    <div key={banco.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {banco.codigo}
                        </div>
                        <div>
                          <p className="font-medium">{banco.nome}</p>
                          <p className="text-sm text-slate-500">Ag: {banco.agencia} • Conta: {banco.conta}</p>
                          {banco.chavePix && <p className="text-xs text-green-600">PIX: {banco.chavePix}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={banco.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                          {banco.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingBanco(banco); setBancoDialog(true); }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteBanco(banco.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impressoras */}
        <TabsContent value="impressoras">
          <Card className="shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Printer size={20} /> Impressoras Fiscais
                </CardTitle>
                <CardDescription>
                  Configure suas impressoras para emissão de cupons e SAT
                </CardDescription>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => { setEditingImpressora(null); setImpressoraDialog(true); }}>
                <Plus size={18} className="mr-2" /> Nova Impressora
              </Button>
            </CardHeader>
            <CardContent>
              {impressoras.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Printer size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma impressora configurada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {impressoras.map((imp) => (
                    <div key={imp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white">
                          <Printer size={24} />
                        </div>
                        <div>
                          <p className="font-medium">{imp.nome}</p>
                          <p className="text-sm text-slate-500">{imp.marca} • {imp.modelo}</p>
                          <p className="text-xs text-slate-400">{imp.porta} • {imp.colunas} colunas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {imp.principal && <Badge className="bg-blue-100 text-blue-700">Principal</Badge>}
                        <Badge className={imp.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                          {imp.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingImpressora(imp); setImpressoraDialog(true); }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteImpressora(imp.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impostos */}
        <TabsContent value="impostos">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Alíquotas Padrão
              </CardTitle>
              <CardDescription>
                Configure as alíquotas padrão para seus produtos e serviços
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <Label>ICMS Padrão (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={impostos.icms}
                    onChange={(e) => setImpostos({ ...impostos, icms: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>PIS Padrão (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={impostos.pis}
                    onChange={(e) => setImpostos({ ...impostos, pis: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>COFINS Padrão (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={impostos.cofins}
                    onChange={(e) => setImpostos({ ...impostos, cofins: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>IPI Padrão (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={impostos.ipi}
                    onChange={(e) => setImpostos({ ...impostos, ipi: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Alert>
                <AlertTriangle size={16} />
                <AlertDescription>
                  Estas alíquotas são aplicadas automaticamente ao criar novos produtos. Você pode personalizar cada produto individualmente.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Banco */}
      <Dialog open={bancoDialog} onOpenChange={setBancoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanco ? 'Editar' : 'Nova'} Conta Bancária</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const banco: ConfigBanco = {
              id: editingBanco?.id || `banco-${Date.now()}`,
              tenantId: '',
              nome: formData.get('nome') as string,
              codigo: formData.get('codigo') as string,
              agencia: formData.get('agencia') as string,
              conta: formData.get('conta') as string,
              tipoConta: formData.get('tipoConta') as 'corrente' | 'poupanca',
              chavePix: formData.get('chavePix') as string || undefined,
              tipoChavePix: formData.get('tipoChavePix') as ConfigBanco['tipoChavePix'] || undefined,
              ativo: formData.get('ativo') === 'on'
            };
            if (editingBanco) {
              updateBanco(editingBanco.id, banco);
            } else {
              addBanco(banco);
            }
            setBancoDialog(false);
            setEditingBanco(null);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Banco *</Label>
                <Input name="nome" defaultValue={editingBanco?.nome} placeholder="Ex: Itaú" required />
              </div>
              <div>
                <Label>Código *</Label>
                <Input name="codigo" defaultValue={editingBanco?.codigo} placeholder="Ex: 341" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Agência *</Label>
                <Input name="agencia" defaultValue={editingBanco?.agencia} required />
              </div>
              <div>
                <Label>Conta *</Label>
                <Input name="conta" defaultValue={editingBanco?.conta} required />
              </div>
            </div>
            <div>
              <Label>Tipo de Conta</Label>
              <Select name="tipoConta" defaultValue={editingBanco?.tipoConta || 'corrente'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <h4 className="font-semibold text-slate-700">PIX (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chave PIX</Label>
                <Input name="chavePix" defaultValue={editingBanco?.chavePix} />
              </div>
              <div>
                <Label>Tipo da Chave</Label>
                <Select name="tipoChavePix" defaultValue={editingBanco?.tipoChavePix || 'cpf'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="aleatoria">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch name="ativo" defaultChecked={editingBanco?.ativo !== false} />
              <Label>Conta ativa</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBancoDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Impressora */}
      <Dialog open={impressoraDialog} onOpenChange={setImpressoraDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingImpressora ? 'Editar' : 'Nova'} Impressora</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const impressora: ConfigImpressora = {
              id: editingImpressora?.id || `imp-${Date.now()}`,
              tenantId: '',
              nome: formData.get('nome') as string,
              modelo: formData.get('modelo') as string,
              marca: formData.get('marca') as string,
              porta: formData.get('porta') as string,
              ip: formData.get('ip') as string || undefined,
              colunas: Number(formData.get('colunas')),
              margemSuperior: Number(formData.get('margemSuperior')),
              margemInferior: Number(formData.get('margemInferior')),
              margemEsquerda: Number(formData.get('margemEsquerda')),
              margemDireita: Number(formData.get('margemDireita')),
              codigoAtivacao: formData.get('codigoAtivacao') as string || undefined,
              ativo: formData.get('ativo') === 'on',
              principal: formData.get('principal') === 'on'
            };
            if (editingImpressora) {
              updateImpressora(editingImpressora.id, impressora);
            } else {
              addImpressora(impressora);
            }
            setImpressoraDialog(false);
            setEditingImpressora(null);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input name="nome" defaultValue={editingImpressora?.nome} required />
              </div>
              <div>
                <Label>Marca</Label>
                <Select name="marca" defaultValue={editingImpressora?.marca || 'bematech'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bematech">Bematech</SelectItem>
                    <SelectItem value="daruma">Daruma</SelectItem>
                    <SelectItem value="elgin">Elgin</SelectItem>
                    <SelectItem value="epson">Epson</SelectItem>
                    <SelectItem value="sweda">Sweda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Modelo</Label>
                <Input name="modelo" defaultValue={editingImpressora?.modelo} />
              </div>
              <div>
                <Label>Porta</Label>
                <Select name="porta" defaultValue={editingImpressora?.porta || 'USB'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USB">USB</SelectItem>
                    <SelectItem value="COM1">COM1</SelectItem>
                    <SelectItem value="COM2">COM2</SelectItem>
                    <SelectItem value="Network">Rede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>IP (se rede)</Label>
              <Input name="ip" defaultValue={editingImpressora?.ip} placeholder="192.168.1.100" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Colunas</Label>
                <Select name="colunas" defaultValue={String(editingImpressora?.colunas || 48)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="80">80</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Margem Sup.</Label>
                <Input name="margemSuperior" type="number" defaultValue={editingImpressora?.margemSuperior || 0} />
              </div>
              <div>
                <Label>Margem Inf.</Label>
                <Input name="margemInferior" type="number" defaultValue={editingImpressora?.margemInferior || 0} />
              </div>
            </div>
            <div>
              <Label>Código Ativação (SAT)</Label>
              <Input name="codigoAtivacao" defaultValue={editingImpressora?.codigoAtivacao} />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch name="ativo" defaultChecked={editingImpressora?.ativo !== false} />
                <Label>Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch name="principal" defaultChecked={editingImpressora?.principal} />
                <Label>Principal</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setImpressoraDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== FUNCIONÁRIOS MODULE ==========
function FuncionariosModule() {
  const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, toggleFuncionarioAtivo } = useAppStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredFuncionarios = useMemo(() => {
    let result = funcionarios.filter(f => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
                          f.email.toLowerCase().includes(search.toLowerCase()) ||
                          f.cpf.includes(search);
      return matchSearch;
    });

    if (sort) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sort.key) {
          case 'nome': aVal = a.nome; bVal = b.nome; break;
          case 'cargo': aVal = a.cargo; bVal = b.cargo; break;
          case 'departamento': aVal = a.departamento; bVal = b.departamento; break;
        }
        if (sort.direction === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    return result;
  }, [funcionarios, search, sort]);

  // Permissões padrão
  const permissoesPadrao: PermissoesAcesso = {
    dashboard: true,
    produtos: false,
    estoque: false,
    financeiro: false,
    faturamento: false,
    pdv: true,
    pedidos: false,
    operacional: false,
    parametros: false,
    admin: false,
    funcionarios: false
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Coletar permissões
    const permissoes: PermissoesAcesso = {
      dashboard: formData.get('perm_dashboard') === 'on',
      produtos: formData.get('perm_produtos') === 'on',
      estoque: formData.get('perm_estoque') === 'on',
      financeiro: formData.get('perm_financeiro') === 'on',
      faturamento: formData.get('perm_faturamento') === 'on',
      pdv: formData.get('perm_pdv') === 'on',
      pedidos: formData.get('perm_pedidos') === 'on',
      operacional: formData.get('perm_operacional') === 'on',
      parametros: formData.get('perm_parametros') === 'on',
      admin: false, // Admin nunca pode ser delegado
      funcionarios: formData.get('perm_funcionarios') === 'on'
    };

    const funcionario: Funcionario = {
      id: editingFuncionario?.id || `func-${Date.now()}`,
      tenantId: '',
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      rg: formData.get('rg') as string || undefined,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      endereco: {
        logradouro: formData.get('logradouro') as string,
        numero: formData.get('numero') as string,
        complemento: formData.get('complemento') as string || '',
        bairro: formData.get('bairro') as string,
        cidade: formData.get('cidade') as string,
        estado: formData.get('estado') as string,
        cep: formData.get('cep') as string
      },
      cargo: formData.get('cargo') as string,
      departamento: formData.get('departamento') as string,
      salario: parseFloat(formData.get('salario') as string) || undefined,
      dataAdmissao: formData.get('dataAdmissao') ? new Date(formData.get('dataAdmissao') as string) : undefined,
      dataNascimento: formData.get('dataNascimento') ? new Date(formData.get('dataNascimento') as string) : undefined,
      permissoes,
      senha: (formData.get('senha') as string) || editingFuncionario?.senha || '123456', // Senha padrão ou mantém a existente
      ativo: formData.get('ativo') === 'on',
      podeAcessarSistema: formData.get('podeAcessarSistema') === 'on',
      dataCriacao: editingFuncionario?.dataCriacao || new Date(),
      dataAtualizacao: new Date(),
      criadoPor: '' // Será preenchido pelo store
    };

    if (editingFuncionario) {
      updateFuncionario(editingFuncionario.id, funcionario);
    } else {
      addFuncionario(funcionario);
    }
    setDialogOpen(false);
    setEditingFuncionario(null);
  };

  const funcionariosAtivos = funcionarios.filter(f => f.ativo).length;
  const funcionariosComAcesso = funcionarios.filter(f => f.ativo && f.podeAcessarSistema).length;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Funcionários</p>
                <p className="text-2xl font-bold text-slate-800">{funcionarios.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{funcionariosAtivos}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Com Acesso ao Sistema</p>
                <p className="text-2xl font-bold text-purple-600">{funcionariosComAcesso}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Shield size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome, email ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" onClick={() => setEditingFuncionario(null)}>
              <Plus size={18} className="mr-2" /> Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFuncionario ? 'Editar' : 'Novo'} Funcionário</DialogTitle>
              <DialogDescription>Preencha os dados do funcionário e configure suas permissões de acesso</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados Pessoais */}
              <Separator />
              <h4 className="font-semibold text-slate-700 flex items-center gap-2"><User size={18} /> Dados Pessoais</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input name="nome" defaultValue={editingFuncionario?.nome} required />
                </div>
                <div>
                  <Label>CPF *</Label>
                  <Input name="cpf" defaultValue={editingFuncionario?.cpf} placeholder="000.000.000-00" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>RG</Label>
                  <Input name="rg" defaultValue={editingFuncionario?.rg} />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input name="dataNascimento" type="date" defaultValue={editingFuncionario?.dataNascimento ? format(new Date(editingFuncionario.dataNascimento), 'yyyy-MM-dd') : ''} />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input name="telefone" defaultValue={editingFuncionario?.telefone} placeholder="(00) 00000-0000" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail *</Label>
                  <Input name="email" type="email" defaultValue={editingFuncionario?.email} required />
                </div>
                <div>
                  <Label>Senha {editingFuncionario ? '(deixe em branco para manter)' : '*'}</Label>
                  <Input name="senha" type="password" placeholder={editingFuncionario ? '••••••' : ''} required={!editingFuncionario} />
                </div>
              </div>

              {/* Endereço */}
              <Separator />
              <h4 className="font-semibold text-slate-700 flex items-center gap-2"><FileText size={18} /> Endereço</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input name="cep" defaultValue={editingFuncionario?.endereco?.cep} placeholder="00000-000" />
                </div>
                <div className="col-span-3">
                  <Label>Logradouro</Label>
                  <Input name="logradouro" defaultValue={editingFuncionario?.endereco?.logradouro} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input name="numero" defaultValue={editingFuncionario?.endereco?.numero} />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input name="complemento" defaultValue={editingFuncionario?.endereco?.complemento} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input name="bairro" defaultValue={editingFuncionario?.endereco?.bairro} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input name="cidade" defaultValue={editingFuncionario?.endereco?.cidade} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Input name="estado" defaultValue={editingFuncionario?.endereco?.estado} placeholder="Ex: SP" maxLength={2} />
                </div>
              </div>

              {/* Dados Profissionais */}
              <Separator />
              <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Wrench size={18} /> Dados Profissionais</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cargo *</Label>
                  <Input name="cargo" defaultValue={editingFuncionario?.cargo} placeholder="Ex: Vendedor" required />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select name="departamento" defaultValue={editingFuncionario?.departamento || 'vendas'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="operacional">Operacional</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                      <SelectItem value="ti">TI</SelectItem>
                      <SelectItem value="rh">RH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <Input name="dataAdmissao" type="date" defaultValue={editingFuncionario?.dataAdmissao ? format(new Date(editingFuncionario.dataAdmissao), 'yyyy-MM-dd') : ''} />
                </div>
              </div>
              <div>
                <Label>Salário</Label>
                <Input name="salario" type="number" step="0.01" defaultValue={editingFuncionario?.salario} />
              </div>

              {/* Status */}
              <Separator />
              <h4 className="font-semibold text-slate-700">Status</h4>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch name="ativo" defaultChecked={editingFuncionario?.ativo !== false} />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="podeAcessarSistema" defaultChecked={editingFuncionario?.podeAcessarSistema} />
                  <Label>Pode acessar o sistema</Label>
                </div>
              </div>

              {/* Permissões */}
              <Separator />
              <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Shield size={18} /> Permissões de Acesso</h4>
              <p className="text-sm text-slate-500 mb-3">Selecione quais módulos do sistema este funcionário poderá acessar:</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                  { key: 'produtos', label: 'Produtos/Serviços', icon: <Tags size={16} /> },
                  { key: 'estoque', label: 'Estoque', icon: <Package size={16} /> },
                  { key: 'financeiro', label: 'Financeiro', icon: <DollarSign size={16} /> },
                  { key: 'faturamento', label: 'Faturamento', icon: <FileText size={16} /> },
                  { key: 'pdv', label: 'PDV', icon: <ShoppingCart size={16} /> },
                  { key: 'pedidos', label: 'Pedidos', icon: <FileSpreadsheet size={16} /> },
                  { key: 'operacional', label: 'Operacional', icon: <Wrench size={16} /> },
                  { key: 'parametros', label: 'Parâmetros', icon: <Settings size={16} /> },
                  { key: 'funcionarios', label: 'Funcionários', icon: <Users size={16} /> },
                ].map((perm) => (
                  <div key={perm.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <Switch 
                      name={`perm_${perm.key}`} 
                      defaultChecked={editingFuncionario?.permissoes?.[perm.key as keyof PermissoesAcesso] ?? permissoesPadrao[perm.key as keyof PermissoesAcesso]}
                    />
                    <div className="flex items-center gap-2">
                      {perm.icon}
                      <Label className="text-sm">{perm.label}</Label>
                    </div>
                  </div>
                ))}
              </div>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  A permissão de <strong>Admin</strong> não pode ser delegada a funcionários. Apenas o administrador master tem acesso total.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead><SortableHeader label="Nome" sortKey="nome" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>CPF</TableHead>
                <TableHead><SortableHeader label="Cargo" sortKey="cargo" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Departamento" sortKey="departamento" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acesso Sistema</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFuncionarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Nenhum funcionário cadastrado. Clique em "Novo Funcionário" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFuncionarios.map((func) => (
                  <TableRow key={func.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{func.nome}</p>
                        <p className="text-xs text-slate-500">{func.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{func.cpf}</TableCell>
                    <TableCell>{func.cargo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{func.departamento}</Badge>
                    </TableCell>
                    <TableCell>{func.telefone}</TableCell>
                    <TableCell>
                      <Badge className={func.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {func.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {func.podeAcessarSistema ? (
                        <Badge className="bg-purple-100 text-purple-700">Sim</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingFuncionario(func); setDialogOpen(true); }}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-amber-600 hover:bg-amber-50" onClick={() => toggleFuncionarioAtivo(func.id)}>
                        {func.ativo ? <X size={16} /> : <CheckCircle size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => deleteFuncionario(func.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== CATEGORIAS MODULE ==========
function CategoriasModule() {
  const { categorias, produtos, addCategoria, updateCategoria, deleteCategoria } = useAppStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  const filteredCategorias = useMemo(() => {
    if (!search) return categorias;
    return categorias.filter(c => 
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao.toLowerCase().includes(search.toLowerCase())
    );
  }, [categorias, search]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const categoria: Categoria = {
      id: editingCategoria?.id || `cat-${Date.now()}`,
      tenantId: '',
      nome: formData.get('nome') as string,
      descricao: formData.get('descricao') as string || '',
      cor: formData.get('cor') as string || '#3b82f6',
      ativa: formData.get('ativa') === 'on'
    };

    if (editingCategoria) {
      updateCategoria(editingCategoria.id, categoria);
    } else {
      addCategoria(categoria);
    }
    setDialogOpen(false);
    setEditingCategoria(null);
  };

  const getCategoriaUsage = (categoriaId: string) => {
    return produtos.filter(p => p.categoriaId === categoriaId).length;
  };

  const categoriasAtivas = categorias.filter(c => c.ativa).length;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Categorias</p>
                <p className="text-2xl font-bold text-slate-800">{categorias.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Tags size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{categoriasAtivas}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Inativas</p>
                <p className="text-2xl font-bold text-red-600">{categorias.length - categoriasAtivas}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <X size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" onClick={() => setEditingCategoria(null)}>
              <Plus size={18} className="mr-2" /> Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategoria ? 'Editar' : 'Nova'} Categoria</DialogTitle>
              <DialogDescription>Cadastre uma categoria para organizar produtos e serviços</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input name="nome" defaultValue={editingCategoria?.nome} placeholder="Ex: Eletrônicos" required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea name="descricao" defaultValue={editingCategoria?.descricao} placeholder="Descrição da categoria" />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input name="cor" type="color" defaultValue={editingCategoria?.cor || '#3b82f6'} className="w-16 h-10 p-1 cursor-pointer" />
                  <Input name="corText" defaultValue={editingCategoria?.cor || '#3b82f6'} placeholder="#3b82f6" className="flex-1" 
                    onChange={(e) => {
                      const input = e.target.form?.elements.namedItem('cor') as HTMLInputElement;
                      if (input) input.value = e.target.value;
                    }} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch name="ativa" defaultChecked={editingCategoria?.ativa !== false} />
                <Label>Ativa</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategorias.length === 0 ? (
          <Card className="col-span-full shadow-lg border-0">
            <CardContent className="p-8 text-center text-slate-500">
              <Tags size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Nenhuma categoria cadastrada.</p>
              <p className="text-sm">Clique em "Nova Categoria" para adicionar.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCategorias.map((categoria) => {
            const usageCount = getCategoriaUsage(categoria.id);
            return (
              <Card key={categoria.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: categoria.cor }}
                      >
                        {categoria.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{categoria.nome}</h3>
                        <p className="text-xs text-slate-500">{usageCount} produto(s)</p>
                      </div>
                    </div>
                    <Badge className={categoria.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {categoria.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  {categoria.descricao && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{categoria.descricao}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setEditingCategoria(categoria); setDialogOpen(true); }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (usageCount === 0 || confirm(`Esta categoria possui ${usageCount} produto(s) associado(s). Deseja excluir mesmo assim?`)) {
                          deleteCategoria(categoria.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ========== FORNECEDORES MODULE ==========
function FornecedoresModule() {
  const { fornecedores, addFornecedor, updateFornecedor, deleteFornecedor, loadFornecedores } = useAppStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  useEffect(() => {
    loadFornecedores();
  }, [loadFornecedores]);

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter(f => 
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search) ||
      f.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [fornecedores, search]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const fornecedor: Fornecedor = {
      id: editingFornecedor?.id || `forn-${Date.now()}`,
      tenantId: '',
      nome: formData.get('nome') as string,
      razaoSocial: formData.get('razaoSocial') as string || undefined,
      cnpj: formData.get('cnpj') as string,
      inscricaoEstadual: formData.get('inscricaoEstadual') as string || undefined,
      inscricaoMunicipal: formData.get('inscricaoMunicipal') as string || undefined,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      telefone2: formData.get('telefone2') as string || undefined,
      endereco: {
        logradouro: formData.get('logradouro') as string,
        numero: formData.get('numero') as string,
        complemento: formData.get('complemento') as string || '',
        bairro: formData.get('bairro') as string,
        cidade: formData.get('cidade') as string,
        estado: formData.get('estado') as string,
        cep: formData.get('cep') as string
      },
      contato: formData.get('contato') as string,
      cargo: formData.get('cargo') as string || undefined,
      site: formData.get('site') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
      dadosBancarios: {
        banco: formData.get('banco') as string || undefined,
        agencia: formData.get('agencia') as string || undefined,
        conta: formData.get('conta') as string || undefined,
        tipoConta: formData.get('tipoConta') as 'corrente' | 'poupanca' || undefined,
        pix: formData.get('pix') as string || undefined
      },
      ativo: formData.get('ativo') === 'on',
      dataCriacao: editingFornecedor?.dataCriacao || new Date()
    };

    if (editingFornecedor) {
      updateFornecedor(editingFornecedor.id, fornecedor);
    } else {
      addFornecedor(fornecedor);
    }
    setDialogOpen(false);
    setEditingFornecedor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome, CNPJ ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => setEditingFornecedor(null)}>
              <Plus size={18} className="mr-2" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFornecedor ? 'Editar' : 'Novo'} Fornecedor</DialogTitle>
              <DialogDescription>Preencha os dados do fornecedor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome Fantasia *</Label><Input name="nome" defaultValue={editingFornecedor?.nome} required /></div>
                <div><Label>Razão Social</Label><Input name="razaoSocial" defaultValue={editingFornecedor?.razaoSocial} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>CNPJ *</Label><Input name="cnpj" defaultValue={editingFornecedor?.cnpj} required placeholder="00.000.000/0000-00" /></div>
                <div><Label>Inscrição Estadual</Label><Input name="inscricaoEstadual" defaultValue={editingFornecedor?.inscricaoEstadual} /></div>
                <div><Label>Inscrição Municipal</Label><Input name="inscricaoMunicipal" defaultValue={editingFornecedor?.inscricaoMunicipal} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email *</Label><Input name="email" type="email" defaultValue={editingFornecedor?.email} required /></div>
                <div><Label>Telefone *</Label><Input name="telefone" defaultValue={editingFornecedor?.telefone} required placeholder="(00) 00000-0000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone 2</Label><Input name="telefone2" defaultValue={editingFornecedor?.telefone2} /></div>
                <div><Label>Site</Label><Input name="site" defaultValue={editingFornecedor?.site} placeholder="https://" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Contato Principal</Label><Input name="contato" defaultValue={editingFornecedor?.contato} /></div>
                <div><Label>Cargo do Contato</Label><Input name="cargo" defaultValue={editingFornecedor?.cargo} /></div>
              </div>
              
              <Separator />
              <h4 className="font-semibold text-slate-700">Endereço</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><Label>Logradouro</Label><Input name="logradouro" defaultValue={editingFornecedor?.endereco?.logradouro} /></div>
                <div><Label>Número</Label><Input name="numero" defaultValue={editingFornecedor?.endereco?.numero} /></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Complemento</Label><Input name="complemento" defaultValue={editingFornecedor?.endereco?.complemento} /></div>
                <div><Label>Bairro</Label><Input name="bairro" defaultValue={editingFornecedor?.endereco?.bairro} /></div>
                <div><Label>Cidade</Label><Input name="cidade" defaultValue={editingFornecedor?.endereco?.cidade} /></div>
                <div><Label>Estado</Label><Input name="estado" defaultValue={editingFornecedor?.endereco?.estado} maxLength={2} /></div>
              </div>
              <div><Label>CEP</Label><Input name="cep" defaultValue={editingFornecedor?.endereco?.cep} placeholder="00000-000" /></div>
              
              <Separator />
              <h4 className="font-semibold text-slate-700">Dados Bancários</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Banco</Label><Input name="banco" defaultValue={editingFornecedor?.dadosBancarios?.banco} placeholder="Ex: Itaú" /></div>
                <div><Label>Agência</Label><Input name="agencia" defaultValue={editingFornecedor?.dadosBancarios?.agencia} /></div>
                <div><Label>Conta</Label><Input name="conta" defaultValue={editingFornecedor?.dadosBancarios?.conta} /></div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <Select name="tipoConta" defaultValue={editingFornecedor?.dadosBancarios?.tipoConta || 'corrente'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>PIX</Label><Input name="pix" defaultValue={editingFornecedor?.dadosBancarios?.pix} placeholder="Chave PIX" /></div>
              
              <div><Label>Observações</Label><Textarea name="observacoes" defaultValue={editingFornecedor?.observacoes} /></div>
              
              <div className="flex items-center gap-2">
                <Switch name="ativo" defaultChecked={editingFornecedor?.ativo ?? true} />
                <Label>Ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{fornecedor.nome}</p>
                      {fornecedor.razaoSocial && <p className="text-xs text-slate-500">{fornecedor.razaoSocial}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{fornecedor.cnpj}</TableCell>
                  <TableCell>{fornecedor.contato || '-'}</TableCell>
                  <TableCell>{fornecedor.telefone}</TableCell>
                  <TableCell className="text-sm">{fornecedor.email}</TableCell>
                  <TableCell>
                    <Badge className={fornecedor.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingFornecedor(fornecedor); setDialogOpen(true); }}><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => { if (confirm('Confirma exclusão?')) deleteFornecedor(fornecedor.id); }}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFornecedores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    Nenhum fornecedor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== UNIDADES DE MEDIDA MODULE ==========
function UnidadesMedidaModule() {
  const { unidadesMedida, addUnidadeMedida, updateUnidadeMedida, deleteUnidadeMedida, loadUnidadesMedida } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeMedida | null>(null);

  useEffect(() => {
    loadUnidadesMedida();
  }, [loadUnidadesMedida]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const unidade: UnidadeMedida = {
      id: editingUnidade?.id || `unid-${Date.now()}`,
      tenantId: '',
      sigla: formData.get('sigla') as string,
      nome: formData.get('nome') as string,
      fatorConversao: parseFloat(formData.get('fatorConversao') as string) || undefined,
      unidadeBase: formData.get('unidadeBase') as string || undefined,
      ativo: formData.get('ativo') === 'on'
    };

    if (editingUnidade) {
      updateUnidadeMedida(editingUnidade.id, unidade);
    } else {
      addUnidadeMedida(unidade);
    }
    setDialogOpen(false);
    setEditingUnidade(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Unidades de Medida</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => setEditingUnidade(null)}>
              <Plus size={18} className="mr-2" /> Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnidade ? 'Editar' : 'Nova'} Unidade de Medida</DialogTitle>
              <DialogDescription>Cadastre unidades de medida e suas conversões</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sigla *</Label>
                  <Input name="sigla" defaultValue={editingUnidade?.sigla} required placeholder="Ex: CX, UN, KG" maxLength={5} />
                </div>
                <div>
                  <Label>Nome *</Label>
                  <Input name="nome" defaultValue={editingUnidade?.nome} required placeholder="Ex: Caixa, Unidade" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fator de Conversão</Label>
                  <Input name="fatorConversao" type="number" step="0.01" defaultValue={editingUnidade?.fatorConversao} placeholder="Ex: 12 para 1 CX = 12 UN" />
                  <p className="text-xs text-slate-500 mt-1">Quantas unidades base cabem nesta unidade</p>
                </div>
                <div>
                  <Label>Unidade Base</Label>
                  <Select name="unidadeBase" defaultValue={editingUnidade?.unidadeBase || ''}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.filter(u => u.id !== editingUnidade?.id).map((u) => (
                        <SelectItem key={u.id} value={u.sigla}>{u.sigla} - {u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch name="ativo" defaultChecked={editingUnidade?.ativo ?? true} />
                <Label>Ativo</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
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
                <TableRow key={unidade.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold">{unidade.sigla}</TableCell>
                  <TableCell>{unidade.nome}</TableCell>
                  <TableCell>{unidade.fatorConversao || '-'}</TableCell>
                  <TableCell>{unidade.unidadeBase || '-'}</TableCell>
                  <TableCell>
                    <Badge className={unidade.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {unidade.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingUnidade(unidade); setDialogOpen(true); }}><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => { if (confirm('Confirma exclusão?')) deleteUnidadeMedida(unidade.id); }}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {unidadesMedida.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhuma unidade de medida cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
