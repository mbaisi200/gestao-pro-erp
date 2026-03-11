'use client';

import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CreditCard,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { produtos, contasPagar, contasReceber, pedidos, vendas, clientes, dashboardMetrics } = useAppStore();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Início e fim do mês atual
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  // Cálculos de contas
  const totalPagarPendente = useMemo(() => 
    contasPagar
      .filter(c => c.status === 'pendente' || c.status === 'vencido')
      .reduce((acc, c) => acc + c.valor, 0),
    [contasPagar]
  );
  
  const totalReceberPendente = useMemo(() => 
    contasReceber
      .filter(c => c.status === 'pendente' || c.status === 'vencido')
      .reduce((acc, c) => acc + c.valor, 0),
    [contasReceber]
  );

  const totalPago = useMemo(() => 
    contasPagar
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + c.valor, 0),
    [contasPagar]
  );

  const totalRecebido = useMemo(() => 
    contasReceber
      .filter(c => c.status === 'recebido')
      .reduce((acc, c) => acc + c.valor, 0),
    [contasReceber]
  );

  const saldoProjetado = totalReceberPendente - totalPagarPendente;

  // Produtos com estoque baixo (apenas produtos, não serviços)
  const produtosEstoqueBaixo = useMemo(() => 
    produtos.filter(p => p.tipo === 'produto' && p.estoqueAtual <= p.estoqueMinimo),
    [produtos]
  );

  // Pedidos pendentes
  const pedidosPendentes = useMemo(() => 
    pedidos.filter(p => p.status === 'pendente' || p.status === 'aprovado'),
    [pedidos]
  );

  // Vendas do mês atual
  const vendasMes = useMemo(() => 
    vendas.filter(v => {
      const dataVenda = new Date(v.dataVenda);
      return dataVenda >= inicioMes && dataVenda <= fimMes && v.status === 'concluida';
    }),
    [vendas, inicioMes, fimMes]
  );

  // Receita do mês (baseada nas vendas concluídas)
  const receitaMesCalculada = useMemo(() => 
    vendasMes.reduce((acc, v) => acc + v.total, 0),
    [vendasMes]
  );

  // Despesa do mês (baseada nas contas pagas no período)
  const despesaMesCalculada = useMemo(() => {
    return contasPagar
      .filter(c => {
        if (c.status !== 'pago' || !c.dataPagamento) return false;
        const dataPagamento = new Date(c.dataPagamento);
        return dataPagamento >= inicioMes && dataPagamento <= fimMes;
      })
      .reduce((acc, c) => acc + c.valor, 0);
  }, [contasPagar, inicioMes, fimMes]);

  // Lucro do mês
  const lucroMesCalculado = receitaMesCalculada - despesaMesCalculada;

  // Custo do estoque
  const valorEstoque = useMemo(() => 
    produtos
      .filter(p => p.tipo === 'produto')
      .reduce((acc, p) => acc + (p.estoqueAtual * p.precoCusto), 0),
    [produtos]
  );

  // Contas vencidas
  const contasVencidas = useMemo(() => {
    const pagarVencidas = contasPagar.filter(c => 
      c.status === 'vencido' || (c.vencimento && new Date(c.vencimento) < hoje && c.status === 'pendente')
    ).length;
    const receberVencidas = contasReceber.filter(c => 
      c.status === 'vencido' || (c.vencimento && new Date(c.vencimento) < hoje && c.status === 'pendente')
    ).length;
    return pagarVencidas + receberVencidas;
  }, [contasPagar, contasReceber, hoje]);

  // Variação em relação ao mês anterior (simplificado)
  const variacaoReceita = dashboardMetrics.variacaoReceita || 0;

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Dashboard' },
      ]}
    >
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
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaMesCalculada)}
            description={`${vendasMes.length} vendas no período`}
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
            title="Clientes Ativos"
            value={clientes.filter(c => c.ativo).length}
            description="Cadastrados no sistema"
            icon={Users}
            gradient="from-violet-500 to-purple-600"
          />
          <DashboardCard
            title="Lucro do Mês"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroMesCalculado)}
            description={`Margem: ${receitaMesCalculada > 0 ? ((lucroMesCalculado / receitaMesCalculada) * 100).toFixed(1) : 0}%`}
            icon={lucroMesCalculado >= 0 ? TrendingUp : TrendingDown}
            gradient={lucroMesCalculado >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-rose-600"}
          />
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-green-100 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceberPendente)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Já recebido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRecebido)}
                  </p>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-100 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagarPendente)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Já pago: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
                  </p>
                </div>
                <ArrowUpCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={`border ${saldoProjetado >= 0 ? 'border-blue-100' : 'border-orange-200'} hover:shadow-md transition-shadow`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                  <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoProjetado)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receber - Pagar
                  </p>
                </div>
                <Wallet className={`h-8 w-8 ${saldoProjetado >= 0 ? 'text-green-500' : 'text-red-500'} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(produtosEstoqueBaixo.length > 0 || contasVencidas > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {produtosEstoqueBaixo.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800">
                        {produtosEstoqueBaixo.length} produtos com estoque baixo
                      </p>
                      <p className="text-sm text-orange-700">
                        Verifique o controle de estoque.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
                      <a href="/admin/estoque">Ver</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {contasVencidas > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-800">
                        {contasVencidas} conta(s) vencida(s)
                      </p>
                      <p className="text-sm text-red-700">
                        Regularize o mais rápido possível.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100" asChild>
                      <a href="/admin/financeiro">Ver</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Produtos Cadastrados</CardTitle>
              <CardDescription>Resumo do catálogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{produtos.length}</div>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{produtos.filter(p => p.tipo === 'produto').length} produtos</span>
                <span>{produtos.filter(p => p.tipo === 'servico').length} serviços</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {produtos.filter(p => p.ativo).length} ativos
              </p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a href="/admin/produtos">
                  Gerenciar <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>Status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pedidos.length}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{pedidos.filter(p => p.status === 'pendente').length} pendentes</Badge>
                <Badge variant="secondary">{pedidos.filter(p => p.status === 'aprovado').length} aprovados</Badge>
                <Badge variant="secondary">{pedidos.filter(p => p.status === 'convertido').length} convertidos</Badge>
              </div>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a href="/admin/pedidos">
                  Ver pedidos <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Valor em Estoque</CardTitle>
              <CardDescription>Custo total do inventário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorEstoque)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Baseado no preço de custo
              </p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a href="/admin/estoque">
                  Ver estoque <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Week Comparison */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Desempenho Mensal</CardTitle>
            <CardDescription>Resumo do período atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-green-100 bg-green-50">
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaMesCalculada)}
                </p>
                <p className="text-xs text-muted-foreground">{vendasMes.length} vendas</p>
              </div>
              <div className="p-4 rounded-lg border border-red-100 bg-red-50">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesaMesCalculada)}
                </p>
                <p className="text-xs text-muted-foreground">Contas pagas</p>
              </div>
              <div className={`p-4 rounded-lg border ${variacaoReceita >= 0 ? 'border-blue-100 bg-blue-50' : 'border-red-100 bg-red-50'}`}>
                <p className="text-sm text-muted-foreground">Variação</p>
                <p className={`text-2xl font-bold mt-1 ${variacaoReceita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {variacaoReceita >= 0 ? '+' : ''}{variacaoReceita.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">vs período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
