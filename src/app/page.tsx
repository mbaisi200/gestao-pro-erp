'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import LoginPage from '@/components/LoginPage';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export default function Page() {
  const { isAuthenticated, user, tenant, setUser, setTenant, logout } = useAuthStore();
  const { isLoading: dataLoading, loadUserData, produtos, contasPagar, contasReceber, pedidos, dashboardMetrics, currentTenant } = useAppStore();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const router = useRouter();

  // Verificar estado do Firebase Auth e sincronizar
  useEffect(() => {
    console.log('=== AUTH SYNC EFFECT ===');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state:', firebaseUser?.email || 'null');
      
      if (firebaseUser) {
        // Usuário logado no Firebase - buscar perfil
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const profile = userSnap.data();
            console.log('Profile encontrado:', profile.email);
            
            // Buscar tenant
            let tenantData = null;
            if (profile.tenantId) {
              const tenantRef = doc(db, 'tenants', profile.tenantId);
              const tenantSnap = await getDoc(tenantRef);
              
              if (tenantSnap.exists()) {
                const td = tenantSnap.data();
                tenantData = {
                  id: td.id || profile.tenantId,
                  nome: td.nome || 'Empresa',
                  cnpj: td.cnpj || '',
                  email: td.email || '',
                  telefone: td.telefone || '',
                  endereco: td.endereco || {},
                  plano: td.plano || 'basico',
                  status: td.status || 'ativo',
                  dataCriacao: td.dataCriacao?.toDate() || new Date(),
                  dataExpiracao: td.dataExpiracao?.toDate() || new Date(),
                  configuracoes: td.configuracoes || {}
                };
              }
            }
            
            const userData = {
              id: firebaseUser.uid,
              email: profile.email || firebaseUser.email,
              nome: profile.nome || firebaseUser.displayName || 'Usuário',
              role: profile.role || 'vendedor',
              tenantId: profile.tenantId,
              ativo: profile.ativo !== false,
              dataCriacao: profile.criadoEm?.toDate() || new Date()
            };
            
            setUser(userData);
            if (tenantData) setTenant(tenantData);
            
            console.log('Auth sincronizado:', userData.email, 'Tenant:', tenantData?.nome);
            console.log('Firebase Ready - usuário confirmado');
            setFirebaseReady(true);
          } else {
            console.log('Profile não encontrado no Firestore');
            await logout();
            setFirebaseReady(true);
          }
        } catch (error) {
          console.error('Erro ao buscar profile:', error);
          setFirebaseReady(true);
        }
      } else {
        // Usuário não está logado no Firebase
        console.log('Sem usuário no Firebase Auth');
        console.log('Zustand isAuthenticated:', isAuthenticated);
        
        if (isAuthenticated) {
          // Zustand tem sessão salva, mas Firebase Auth ainda pode estar carregando
          // Vamos esperar e verificar novamente
          console.log('Zustand tem sessão, aguardando Firebase Auth...');
          
          // Verificar novamente após um breve delay
          setTimeout(async () => {
            const currentUser = auth.currentUser;
            console.log('Recheck Firebase Auth:', currentUser?.email || 'null');
            
            if (currentUser) {
              // Usuário foi encontrado, forçar re-trigger do onAuthStateChanged
              // Não fazer nada, o listener vai disparar novamente
              console.log('Usuário encontrado no recheck');
            } else {
              // Confirmado: não há usuário no Firebase Auth
              console.log('Sessão realmente expirada - limpando estado');
              await logout();
              setFirebaseReady(true);
            }
          }, 1500);
        } else {
          // Não há sessão no Zustand, pode mostrar login
          setFirebaseReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Carregar dados quando autenticado
  useEffect(() => {
    const activeTenant = tenant || currentTenant;
    
    // Só carregar dados se:
    // 1. Está autenticado no Zustand
    // 2. Tem usuário e tenant
    // 3. Firebase está pronto
    // 4. Firebase Auth tem um usuário logado
    const firebaseUser = auth.currentUser;
    console.log('=== LOAD DATA CHECK ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user?.email);
    console.log('activeTenant:', activeTenant?.id);
    console.log('firebaseReady:', firebaseReady);
    console.log('firebaseUser:', firebaseUser?.email);
    
    if (isAuthenticated && user && activeTenant && firebaseReady && firebaseUser) {
      console.log('>>> CARREGANDO DADOS para:', activeTenant.id);
      loadUserData(user, activeTenant);
    } else if (isAuthenticated && firebaseReady && !firebaseUser) {
      console.log('>>> Firebase Auth sem usuário mas Zustand autenticado - aguardando...');
      // Firebase Auth pode estar carregando a sessão do IndexedDB
      // Vamos verificar novamente após um breve delay
      const checkInterval = setInterval(() => {
        const currentUser = auth.currentUser;
        console.log('Rechecking Firebase Auth:', currentUser?.email || 'null');
        if (currentUser) {
          clearInterval(checkInterval);
          console.log('>>> Firebase Auth pronto - carregando dados');
          loadUserData(user, activeTenant);
        }
      }, 500);
      
      // Timeout após 5 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!auth.currentUser) {
          console.log('>>> Timeout aguardando Firebase Auth - fazendo logout');
          logout();
        }
      }, 5000);
    }
  }, [isAuthenticated, user, tenant, currentTenant, firebaseReady, loadUserData]);

  // Aguardando Firebase Auth
  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Verificando autenticação...</h2>
        </div>
      </div>
    );
  }

  // Tela de login
  if (!isAuthenticated || !user) {
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

  // Dashboard principal
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
