'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import LoginPage from '@/components/LoginPage';
import { Loader2 } from 'lucide-react';
import { useHydration } from '@/hooks/use-hydration';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

export default function Page() {
  const { isAuthenticated, user, tenant } = useAuthStore();
  const { isLoading: dataLoading, loadUserData, produtos, contasPagar, contasReceber, pedidos, dashboardMetrics } = useAppStore();
  const hydrated = useHydration();
  const router = useRouter();

  // Carregar dados do usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && tenant) {
      loadUserData(user, tenant);
    }
  }, [isAuthenticated, user, tenant, loadUserData]);

  // Aguardando hidratação do Zustand
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Tela de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Carregando dados
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Carregando dados...</h2>
        </div>
      </div>
    );
  }

  // Dashboard principal na rota /
  // Calcular estatísticas
  const totalPagarPendente = contasPagar
    .filter(c => c.status === 'pendente' || c.status === 'vencido')
    .reduce((acc, c) => acc + c.valor, 0);
  
  const totalReceberPendente = contasReceber
    .filter(c => c.status === 'pendente' || c.status === 'vencido')
    .reduce((acc, c) => acc + c.valor, 0);

  const saldoProjetado = totalReceberPendente - totalPagarPendente;
  const produtosEstoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo);
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente' || p.status === 'aprovado');

  return (
    <MainLayout breadcrumbs={[{ title: 'Dashboard' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user?.nome}! Resumo do seu negócio.
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
            <a href="/pdv">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Abrir PDV
            </a>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Receita do Mês"
            value={`R$ ${dashboardMetrics.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            description="Faturamento mensal"
            icon={DollarSign}
            gradient="from-emerald-500 to-green-600"
          />
          <DashboardCard
            title="Pedidos Pendentes"
            value={pedidosPendentes.length}
            description="Aguardando processamento"
            icon={Package}
            gradient="from-blue-500 to-indigo-600"
          />
          <DashboardCard
            title="Produtos Ativos"
            value={produtos.filter(p => p.ativo).length}
            description="Catálogo disponível"
            icon={Package}
            gradient="from-violet-500 to-purple-600"
          />
          <DashboardCard
            title="Lucro Líquido"
            value={`R$ ${dashboardMetrics.lucroMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            description={`Variação: ${dashboardMetrics.variacaoReceita.toFixed(1)}%`}
            icon={TrendingUp}
            gradient="from-blue-500 to-indigo-600"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalReceberPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totalPagarPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                  <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Package className={`h-8 w-8 ${saldoProjetado >= 0 ? 'text-green-500' : 'text-red-500'} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
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
                    Alguns produtos estão abaixo do estoque mínimo. Verifique o controle de estoque.
                  </p>
                </div>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
                  <a href="/admin/estoque">Ver Estoque</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Produtos Cadastrados</CardTitle>
              <CardDescription>Resumo do catálogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{produtos.length}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {produtos.filter(p => p.ativo).length} ativos
              </p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a href="/admin/produtos">
                  Gerenciar produtos <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimas movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pedidos.length}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Total de pedidos registrados
              </p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a href="/admin/pedidos">
                  Ver pedidos <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-24 flex-col gap-2" asChild>
            <a href="/admin/financeiro">
              <DollarSign className="h-6 w-6" />
              <span className="font-bold">Financeiro</span>
            </a>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" asChild>
            <a href="/admin/relatorios">
              <TrendingUp className="h-6 w-6" />
              <span className="font-bold">Relatórios BI</span>
            </a>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" asChild>
            <a href="/pdv">
              <ShoppingCart className="h-6 w-6" />
              <span className="font-bold">Ponto de Venda</span>
            </a>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
