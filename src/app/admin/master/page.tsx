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
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import { Tenant } from '@/types';
import { createNewTenant, deleteTenant, updateTenant, manageTenantUser } from '@/lib/admin-service';
import { auth } from '@/lib/firebase';
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
  Edit,
  Key,
  Users,
  ShoppingCart,
  Receipt,
  CreditCard,
  Settings,
  Save,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addMonths, isAfter, isBefore, addDays, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { checkTestDataExists, initializeTestUserData, clearTestData } from '@/lib/init-data';
import { 
  collection, 
  writeBatch, 
  deleteDoc, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp, 
  Timestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Tipos de planos (sem valores fixos - cada cliente terá seu valor personalizado)
const TIPOS_PLANO = [
  { id: 'basico', nome: 'Básico', limiteProdutos: 100, limiteUsuarios: 2, cor: 'bg-gray-500', descricao: 'Ideal para pequenos negócios' },
  { id: 'profissional', nome: 'Profissional', limiteProdutos: 500, limiteUsuarios: 5, cor: 'bg-blue-500', descricao: 'Para empresas em crescimento' },
  { id: 'enterprise', nome: 'Enterprise', limiteProdutos: 0, limiteUsuarios: 0, cor: 'bg-purple-500', descricao: 'Ilimitado - para grandes empresas' },
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
  const [dialogEditar, setDialogEditar] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [excluindoEmpresa, setExcluindoEmpresa] = useState<string | null>(null);

  // Estados para popular dados
  const [dataExists, setDataExists] = useState(false);
  const [populatingData, setPopulatingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [activeTab, setActiveTab] = useState('empresas');
  
  // Novos estados para popular dados personalizado
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [periodoDados, setPeriodoDados] = useState<'1m' | '3m' | '6m' | '12m'>('3m');
  const [quantidadeProdutos, setQuantidadeProdutos] = useState<string>('12');
  const [quantidadeClientes, setQuantidadeClientes] = useState<string>('4');
  const [quantidadeVendas, setQuantidadeVendas] = useState<string>('10');
  const [limparAntesPopular, setLimparAntesPopular] = useState<boolean>(true);
  const [dialogPopularDados, setDialogPopularDados] = useState(false);
  
  // Estados para configuração de planos
  const [dialogConfigPlano, setDialogConfigPlano] = useState(false);
  const [planoConfig, setPlanoConfig] = useState({
    tenantId: '',
    nomeEmpresa: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise',
    valorMensal: '',
    valorAnual: '',
    limiteProdutos: 100,
    limiteUsuarios: 2,
    dataExpiracao: '',
  });

  // Formulário nova empresa
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise',
    valorMensal: '',
    meses: 1,
  });

  // Formulário editar empresa
  const [editarEmpresa, setEditarEmpresa] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise',
    valorPlano: '',
    status: 'ativo' as 'ativo' | 'suspenso' | 'expirado',
    dataExpiracao: '',
    senha: '',
    confirmarSenha: '',
  });

  // Carregar tenants ao montar
  useEffect(() => {
    loadTenants();
    checkTestDataExists().then(setDataExists);
  }, [loadTenants]);

  // Limpar dados de um tenant específico
  const handleLimparDadosTenant = async (tenantId: string) => {
    if (!tenantId) {
      toast({ variant: 'destructive', title: 'Selecione uma empresa' });
      return;
    }
    
    if (!confirm('ATENÇÃO: Isso irá apagar TODOS os dados da empresa selecionada. Deseja continuar?')) return;
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita!')) return;
    
    setClearingData(true);
    try {
      const subcollections = [
        'categorias', 'produtos', 'clientes', 'fornecedores', 'funcionarios',
        'contasPagar', 'contasReceber', 'vendas', 'pedidos', 'ordensServico',
        'notasFiscais', 'movimentacoesEstoque'
      ];

      for (const subcol of subcollections) {
        const colRef = collection(db, 'tenants', tenantId, subcol);
        const snapshot = await getDocs(colRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        if (snapshot.docs.length > 0) {
          await batch.commit();
        }
      }

      toast({
        title: 'Dados limpos com sucesso!',
        description: 'Todos os dados da empresa foram removidos.',
      });
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao limpar dados' });
    } finally {
      setClearingData(false);
    }
  };

  // Popular dados personalizado
  const handlePopularDadosPersonalizado = async () => {
    if (!selectedTenantId) {
      toast({ variant: 'destructive', title: 'Selecione uma empresa' });
      return;
    }

    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) {
      toast({ variant: 'destructive', title: 'Empresa não encontrada' });
      return;
    }

    setPopulatingData(true);
    try {
      // Limpar dados se solicitado
      if (limparAntesPopular) {
        await handleLimparDadosTenant(selectedTenantId);
      }

      // Calcular período
      const mesesAtras = periodoDados === '1m' ? 1 : periodoDados === '3m' ? 3 : periodoDados === '6m' ? 6 : 12;
      const dataBase = subMonths(new Date(), mesesAtras);
      
      const qtdProdutos = parseInt(quantidadeProdutos) || 12;
      const qtdClientes = parseInt(quantidadeClientes) || 4;
      const qtdVendas = parseInt(quantidadeVendas) || 10;

      // Criar dados
      await criarDadosPersonalizados(selectedTenantId, tenant.nome, {
        dataBase,
        qtdProdutos,
        qtdClientes,
        qtdVendas,
      });

      toast({
        title: 'Dados populados com sucesso!',
        description: `Criados ${qtdProdutos} produtos, ${qtdClientes} clientes e ${qtdVendas} vendas para ${tenant.nome}`,
      });
      
      setDialogPopularDados(false);
    } catch (error) {
      console.error('Erro ao popular dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao popular dados', description: String(error) });
    } finally {
      setPopulatingData(false);
    }
  };

  // Função para criar dados personalizados
  const criarDadosPersonalizados = async (
    tenantId: string, 
    nomeEmpresa: string, 
    config: { dataBase: Date; qtdProdutos: number; qtdClientes: number; qtdVendas: number }
  ) => {
    const { dataBase, qtdProdutos, qtdClientes, qtdVendas } = config;
    
    // Criar Categorias
    const categorias = [
      { id: `cat-${tenantId}-001`, nome: 'Eletrônicos', descricao: 'Produtos eletrônicos', cor: '#3b82f6', ativa: true },
      { id: `cat-${tenantId}-002`, nome: 'Acessórios', descricao: 'Acessórios diversos', cor: '#10b981', ativa: true },
      { id: `cat-${tenantId}-003`, nome: 'Informática', descricao: 'Produtos de informática', cor: '#f59e0b', ativa: true },
      { id: `cat-${tenantId}-004`, nome: 'Serviços', descricao: 'Serviços prestados', cor: '#ec4899', ativa: true },
    ];

    for (const categoria of categorias) {
      const catRef = doc(db, 'tenants', tenantId, 'categorias', categoria.id);
      await setDoc(catRef, { ...categoria, tenantId });
    }

    // Criar Produtos
    const produtosNomes = [
      'Smartphone Samsung Galaxy', 'Notebook Dell Inspiron', 'Mouse Logitech MX', 
      'Teclado Mecânico RGB', 'Monitor LG 27"', 'Fone Bluetooth JBL',
      'Impressora HP LaserJet', 'Webcam Logitech C920', 'SSD Kingston 480GB',
      'Memória RAM 16GB DDR4', 'HD Externo 1TB', 'Carregador Turbo 65W'
    ];
    
    for (let i = 0; i < Math.min(qtdProdutos, produtosNomes.length); i++) {
      const prodRef = doc(db, 'tenants', tenantId, 'produtos', `prod-${tenantId}-${String(i+1).padStart(3, '0')}`);
      await setDoc(prodRef, {
        id: `prod-${tenantId}-${String(i+1).padStart(3, '0')}`,
        tenantId,
        codigo: String(i+1).padStart(3, '0'),
        codigoBarras: `789${String(i+1).padStart(10, '0')}`,
        nome: produtosNomes[i],
        descricao: produtosNomes[i],
        tipo: i < 10 ? 'produto' : 'servico',
        categoriaId: categorias[i % 4].id,
        ncm: '8517.12.31',
        cst: '000',
        cfop: '5102',
        unidade: i < 10 ? 'UN' : 'HR',
        precoCusto: Math.floor(Math.random() * 2000) + 100,
        precoVenda: Math.floor(Math.random() * 3000) + 200,
        estoqueAtual: Math.floor(Math.random() * 50),
        estoqueMinimo: 5,
        atalhoPDV: true,
        ativo: true,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });
    }

    // Criar Clientes
    const nomesClientes = [
      'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
      'Carlos Ferreira', 'Juliana Lima', 'Roberto Alves', 'Fernanda Rocha'
    ];
    
    for (let i = 0; i < Math.min(qtdClientes, nomesClientes.length); i++) {
      const cliRef = doc(db, 'tenants', tenantId, 'clientes', `cli-${tenantId}-${String(i+1).padStart(3, '0')}`);
      await setDoc(cliRef, {
        id: `cli-${tenantId}-${String(i+1).padStart(3, '0')}`,
        tenantId,
        nome: nomesClientes[i],
        cpfCnpj: `${String(Math.floor(Math.random() * 99999999999)).padStart(11, '0')}`,
        email: `cliente${i+1}@email.com`,
        telefone: `(11) 9${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
        endereco: {
          logradouro: `Rua ${i+1}`,
          numero: String(i * 100 + 10),
          complemento: '',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000-000'
        },
        observacoes: '',
        ativo: true
      });
    }

    // Criar Vendas
    for (let i = 0; i < qtdVendas; i++) {
      const dataVenda = subDays(new Date(), Math.floor(Math.random() * 90));
      const vendaRef = doc(db, 'tenants', tenantId, 'vendas', `venda-${tenantId}-${String(i+1).padStart(3, '0')}`);
      const total = Math.floor(Math.random() * 5000) + 100;
      
      await setDoc(vendaRef, {
        id: `venda-${tenantId}-${String(i+1).padStart(3, '0')}`,
        tenantId,
        numero: 1000 + i + 1,
        clienteId: i < qtdClientes ? `cli-${tenantId}-${String((i % qtdClientes) + 1).padStart(3, '0')}` : null,
        itens: [{
          produtoId: `prod-${tenantId}-001`,
          quantidade: Math.floor(Math.random() * 3) + 1,
          precoUnitario: total,
          desconto: 0,
          total: total
        }],
        subtotal: total,
        desconto: 0,
        total: total,
        formaPagamento: ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'][Math.floor(Math.random() * 4)],
        status: 'concluida',
        dataVenda: Timestamp.fromDate(dataVenda)
      });
    }

    // Criar Contas a Pagar/Receber
    for (let i = 0; i < 5; i++) {
      const vencimento = subDays(new Date(), Math.floor(Math.random() * 60) - 30);
      const valor = Math.floor(Math.random() * 3000) + 500;
      
      // Conta a Pagar
      const cpRef = doc(db, 'tenants', tenantId, 'contasPagar', `cp-${tenantId}-${String(i+1).padStart(3, '0')}`);
      await setDoc(cpRef, {
        id: `cp-${tenantId}-${String(i+1).padStart(3, '0')}`,
        tenantId,
        descricao: `Despesa ${i+1}`,
        valor: valor,
        vencimento: Timestamp.fromDate(vencimento),
        status: vencimento < new Date() ? 'pago' : 'pendente',
        categoria: 'Despesas',
        recorrente: false
      });
      
      // Conta a Receber
      const crRef = doc(db, 'tenants', tenantId, 'contasReceber', `cr-${tenantId}-${String(i+1).padStart(3, '0')}`);
      await setDoc(crRef, {
        id: `cr-${tenantId}-${String(i+1).padStart(3, '0')}`,
        tenantId,
        descricao: `Receita ${i+1}`,
        valor: valor * 1.5,
        vencimento: Timestamp.fromDate(vencimento),
        status: vencimento < new Date() ? 'recebido' : 'pendente',
        categoria: 'Vendas'
      });
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

  // Filtrar empresas (excluir admin-master)
  const empresasFiltradas = tenants.filter(empresa => {
    if (empresa.id === 'admin-master') return false;
    const matchSearch = 
      empresa.nome.toLowerCase().includes(search.toLowerCase()) ||
      empresa.cnpj.includes(search) ||
      empresa.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || empresa.status === filtroStatus;
    const matchPlano = filtroPlano === 'todos' || empresa.plano === filtroPlano;
    return matchSearch && matchStatus && matchPlano;
  });

  // Estatísticas com valores personalizados
  const stats = {
    total: tenants.filter(t => t.id !== 'admin-master').length,
    ativos: tenants.filter(e => e.status === 'ativo' && e.id !== 'admin-master').length,
    suspensos: tenants.filter(e => e.status === 'suspenso').length,
    expirados: tenants.filter(e => e.status === 'expirado' || (e.dataExpiracao && isBefore(new Date(e.dataExpiracao), new Date()))).length,
    receitaMensal: tenants
      .filter(e => e.status === 'ativo' && e.id !== 'admin-master')
      .reduce((acc, e) => acc + (e.valorPlano || 0), 0),
    expirandoEm7Dias: tenants.filter(e => {
      if (!e.dataExpiracao || e.id === 'admin-master') return false;
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
      const dataExpiracao = addMonths(new Date(), novaEmpresa.meses);
      const valorPlano = parseFloat(novaEmpresa.valorMensal) || 0;

      const tenantId = await createNewTenant({
        nome: novaEmpresa.nome,
        cnpj: novaEmpresa.cnpj,
        email: novaEmpresa.email,
        telefone: novaEmpresa.telefone,
        endereco: {
          logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
        },
        plano: novaEmpresa.plano,
        valorPlano: valorPlano,
        dataExpiracao
      });

      const novoTenant: Tenant = {
        id: tenantId,
        nome: novaEmpresa.nome,
        cnpj: novaEmpresa.cnpj,
        email: novaEmpresa.email,
        telefone: novaEmpresa.telefone,
        endereco: { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
        plano: novaEmpresa.plano,
        valorPlano: valorPlano,
        status: 'ativo',
        dataCriacao: new Date(),
        dataExpiracao,
        configuracoes: {
          corTema: '#2563eb', logoUrl: '', moeda: 'BRL', timezone: 'America/Sao_Paulo', nfSerie: 1, nfNumeroAtual: 1000
        }
      };

      addTenant(novoTenant);

      toast({ title: 'Empresa criada!', description: `${novaEmpresa.nome} foi cadastrada com sucesso.` });
      setDialogNovaEmpresa(false);
      setNovaEmpresa({ nome: '', cnpj: '', email: '', telefone: '', plano: 'basico', valorMensal: '', meses: 1 });

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
      toast({ title: 'Status alterado!', description: `${empresa.nome} foi ${novoStatus === 'ativo' ? 'ativado' : novoStatus === 'suspenso' ? 'suspenso' : 'marcado como expirado'}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
    }
  };

  // Estender período
  const handleEstenderPeriodo = async (empresa: Tenant, meses: number) => {
    try {
      const novaData = addMonths(empresa.dataExpiracao || new Date(), meses);
      await updateTenant(empresa.id, { dataExpiracao: novaData });
      toast({ title: 'Período estendido!', description: `${empresa.nome} - Nova expiração: ${format(novaData, "dd/MM/yyyy", { locale: ptBR })}` });
      loadTenants();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao estender período' });
    }
  };

  // Excluir empresa
  const handleExcluirEmpresa = async (empresa: Tenant) => {
    if (!confirm(`TEM CERTEZA que deseja excluir a empresa "${empresa.nome}"?\n\nEsta ação é IRREVERSÍVEL e apagará TODOS os dados.`)) return;
    if (!confirm(`ÚLTIMA CONFIRMAÇÃO!\n\nA empresa "${empresa.nome}" será EXCLUÍDA PERMANENTEMENTE.`)) return;

    setExcluindoEmpresa(empresa.id);
    try {
      await deleteTenant(empresa.id);
      setTenants(tenants.filter(t => t.id !== empresa.id));
      toast({ title: 'Empresa excluída!', description: `${empresa.nome} foi removida permanentemente.` });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({ variant: 'destructive', title: 'Erro ao excluir empresa', description: String(error) });
    } finally {
      setExcluindoEmpresa(null);
    }
  };

  // Abrir dialog de edição
  const handleAbrirEdicao = (empresa: Tenant) => {
    setEmpresaSelecionada(empresa);
    setEditarEmpresa({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone || '',
      plano: empresa.plano,
      valorPlano: String(empresa.valorPlano || ''),
      status: empresa.status,
      dataExpiracao: empresa.dataExpiracao ? format(new Date(empresa.dataExpiracao), 'yyyy-MM-dd') : '',
      senha: '',
      confirmarSenha: '',
    });
    setDialogEditar(true);
  };

  // Abrir dialog de configuração de plano
  const handleAbrirConfigPlano = (empresa: Tenant) => {
    setPlanoConfig({
      tenantId: empresa.id,
      nomeEmpresa: empresa.nome,
      plano: empresa.plano,
      valorMensal: String(empresa.valorPlano || ''),
      valorAnual: String((empresa.valorPlano || 0) * 12 * 0.9),
      limiteProdutos: empresa.configuracoes?.limiteProdutos || 100,
      limiteUsuarios: empresa.configuracoes?.limiteUsuarios || 2,
      dataExpiracao: empresa.dataExpiracao ? format(new Date(empresa.dataExpiracao), 'yyyy-MM-dd') : '',
    });
    setDialogConfigPlano(true);
  };

  // Salvar configuração do plano
  const handleSalvarConfigPlano = async () => {
    setSaving(true);
    try {
      await updateTenant(planoConfig.tenantId, {
        plano: planoConfig.plano,
        valorPlano: parseFloat(planoConfig.valorMensal) || 0,
        dataExpiracao: planoConfig.dataExpiracao ? new Date(planoConfig.dataExpiracao) : undefined,
        configuracoes: {
          limiteProdutos: planoConfig.limiteProdutos,
          limiteUsuarios: planoConfig.limiteUsuarios,
        }
      });
      
      loadTenants();
      toast({ title: 'Plano atualizado!', description: `Configurações do plano salvas para ${planoConfig.nomeEmpresa}` });
      setDialogConfigPlano(false);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar configuração' });
    } finally {
      setSaving(false);
    }
  };

  // Salvar edição da empresa
  const handleSalvarEdicao = async () => {
    if (!empresaSelecionada) return;
    if (!editarEmpresa.nome || !editarEmpresa.cnpj || !editarEmpresa.email) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    if (editarEmpresa.senha && editarEmpresa.senha !== editarEmpresa.confirmarSenha) {
      toast({ variant: 'destructive', title: 'As senhas não conferem' });
      return;
    }

    setSaving(true);
    try {
      await updateTenant(empresaSelecionada.id, {
        nome: editarEmpresa.nome,
        cnpj: editarEmpresa.cnpj,
        email: editarEmpresa.email,
        telefone: editarEmpresa.telefone,
        plano: editarEmpresa.plano,
        valorPlano: parseFloat(editarEmpresa.valorPlano) || 0,
        status: editarEmpresa.status,
        dataExpiracao: editarEmpresa.dataExpiracao ? new Date(editarEmpresa.dataExpiracao) : undefined,
      });

      if (editarEmpresa.senha) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          await manageTenantUser(empresaSelecionada.id, editarEmpresa.email, editarEmpresa.senha, editarEmpresa.nome, idToken);
        }
      }

      loadTenants();
      toast({ title: 'Empresa atualizada!', description: `${editarEmpresa.nome} foi atualizada.` });
      setDialogEditar(false);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar empresa', description: String(error) });
    } finally {
      setSaving(false);
    }
  };

  // Badge de status
  const getStatusBadge = (empresa: Tenant) => {
    const expirado = empresa.dataExpiracao && isBefore(new Date(empresa.dataExpiracao), new Date());
    if (expirado || empresa.status === 'expirado') return <Badge className="bg-red-500">Expirado</Badge>;
    if (empresa.status === 'suspenso') return <Badge className="bg-yellow-500">Suspenso</Badge>;
    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  // Badge do plano
  const getPlanoBadge = (plano: string) => {
    const p = TIPOS_PLANO.find(x => x.id === plano);
    return <Badge className={p?.cor || 'bg-gray-500'}>{p?.nome || plano}</Badge>;
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
            <p className="text-muted-foreground">Gerencie todas as empresas e dados do sistema</p>
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
                    <DialogDescription>Preencha os dados para criar uma nova empresa</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome da Empresa *</Label>
                      <Input value={novaEmpresa.nome} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })} placeholder="Razão Social" />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ *</Label>
                      <Input value={novaEmpresa.cnpj} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={novaEmpresa.email} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })} placeholder="empresa@email.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={novaEmpresa.telefone} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })} placeholder="(00) 0000-0000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Plano</Label>
                        <Select value={novaEmpresa.plano} onValueChange={(value) => setNovaEmpresa({ ...novaEmpresa, plano: value as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_PLANO.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Mensal (R$)</Label>
                        <Input type="number" value={novaEmpresa.valorMensal} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, valorMensal: e.target.value })} placeholder="0,00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Período (meses)</Label>
                      <Select value={novaEmpresa.meses.toString()} onValueChange={(value) => setNovaEmpresa({ ...novaEmpresa, meses: parseInt(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mês</SelectItem>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                          <SelectItem value="12">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogNovaEmpresa(false)}>Cancelar</Button>
                    <Button onClick={handleCriarEmpresa} disabled={saving}>{saving ? 'Criando...' : 'Criar Empresa'}</Button>
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
                      <p className="text-2xl font-bold text-emerald-600">R$ {stats.receitaMensal.toLocaleString('pt-BR')}</p>
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
                      <p className="font-semibold text-orange-800">Atenção: {stats.expirandoEm7Dias} empresa(s) expirando nos próximos 7 dias</p>
                      <p className="text-sm text-orange-700">Entre em contato para renovação ou suspenda o acesso.</p>
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
                    <Input placeholder="Buscar por nome, CNPJ ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="suspenso">Suspensos</SelectItem>
                      <SelectItem value="expirado">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {TIPOS_PLANO.map(p => (
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
                <CardDescription>{empresasFiltradas.length} empresa(s) encontrada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma empresa encontrada</TableCell>
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
                              <TableCell>
                                <span className="font-semibold text-green-600">
                                  R$ {(empresa.valorPlano || 0).toLocaleString('pt-BR')}/mês
                                </span>
                              </TableCell>
                              <TableCell>{getStatusBadge(empresa)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className={expirado ? 'text-red-600 font-medium' : expiraEm7Dias ? 'text-orange-600 font-medium' : ''}>
                                    {empresa.dataExpiracao ? format(new Date(empresa.dataExpiracao), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{empresa.email}</div>
                                  {empresa.telefone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{empresa.telefone}</div>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setEmpresaSelecionada(empresa); setDialogDetalhes(true); }}>
                                      <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAbrirEdicao(empresa)}>
                                      <Edit className="h-4 w-4 mr-2" />Editar Empresa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAbrirConfigPlano(empresa)}>
                                      <Settings className="h-4 w-4 mr-2" />Configurar Plano
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleEstenderPeriodo(empresa, 1)}>
                                      <Calendar className="h-4 w-4 mr-2" />Estender +1 mês
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEstenderPeriodo(empresa, 12)}>
                                      <Calendar className="h-4 w-4 mr-2" />Estender +1 ano
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {empresa.status !== 'ativo' && (
                                      <DropdownMenuItem onClick={() => handleAlterarStatus(empresa, 'ativo')}>
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />Ativar
                                      </DropdownMenuItem>
                                    )}
                                    {empresa.status === 'ativo' && (
                                      <DropdownMenuItem onClick={() => handleAlterarStatus(empresa, 'suspenso')}>
                                        <PauseCircle className="h-4 w-4 mr-2 text-yellow-600" />Suspender
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleExcluirEmpresa(empresa)} className="text-red-600 focus:bg-red-50" disabled={excluindoEmpresa === empresa.id}>
                                      {excluindoEmpresa === empresa.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
                  Popular Base de Dados
                </CardTitle>
                <CardDescription>
                  Crie dados de demonstração para qualquer empresa cadastrada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seleção de Empresa */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Empresa de Destino</Label>
                      <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.filter(t => t.id !== 'admin-master').map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome} ({t.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Período dos Dados</Label>
                      <Select value={periodoDados} onValueChange={(v) => setPeriodoDados(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">Último 1 mês</SelectItem>
                          <SelectItem value="3m">Últimos 3 meses</SelectItem>
                          <SelectItem value="6m">Últimos 6 meses</SelectItem>
                          <SelectItem value="12m">Último 1 ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quantidades */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Quantidade de Dados</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Produtos</Label>
                      <Input type="number" value={quantidadeProdutos} onChange={(e) => setQuantidadeProdutos(e.target.value)} min="0" max="100" />
                    </div>
                    <div className="space-y-2">
                      <Label>Clientes</Label>
                      <Input type="number" value={quantidadeClientes} onChange={(e) => setQuantidadeClientes(e.target.value)} min="0" max="50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendas</Label>
                      <Input type="number" value={quantidadeVendas} onChange={(e) => setQuantidadeVendas(e.target.value)} min="0" max="200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fornecedores</Label>
                      <Input type="number" value="3" disabled className="bg-gray-100" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Opções */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="limparAntes"
                      checked={limparAntesPopular}
                      onChange={(e) => setLimparAntesPopular(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="limparAntes" className="font-medium">
                      Limpar todos os dados existentes antes de popular
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                    Se marcado, todos os dados atuais da empresa serão excluídos antes de criar novos dados.
                  </p>
                </div>

                <Separator />

                {/* Preview dos dados */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center border-blue-200">
                    <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{quantidadeProdutos}</p>
                    <p className="text-sm text-muted-foreground">Produtos</p>
                  </Card>
                  <Card className="p-4 text-center border-green-200">
                    <UserCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{quantidadeClientes}</p>
                    <p className="text-sm text-muted-foreground">Clientes</p>
                  </Card>
                  <Card className="p-4 text-center border-purple-200">
                    <ShoppingCart className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{quantidadeVendas}</p>
                    <p className="text-sm text-muted-foreground">Vendas</p>
                  </Card>
                  <Card className="p-4 text-center border-orange-200">
                    <Receipt className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">10</p>
                    <p className="text-sm text-muted-foreground">Contas</p>
                  </Card>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    className="flex-1 h-12 gap-2"
                    onClick={() => setDialogPopularDados(true)}
                    disabled={!selectedTenantId}
                  >
                    <Database className="h-5 w-5" />
                    Popular Dados
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-12 gap-2"
                    onClick={() => handleLimparDadosTenant(selectedTenantId)}
                    disabled={!selectedTenantId || clearingData}
                  >
                    {clearingData ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    Limpar Base de Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Detalhes */}
      <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
        <DialogContent className="max-w-md">
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
                  <p className="font-bold text-xl">{empresaSelecionada.nome}</p>
                  <p className="text-muted-foreground">{empresaSelecionada.cnpj}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{empresaSelecionada.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{empresaSelecionada.telefone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  {getPlanoBadge(empresaSelecionada.plano)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="font-bold text-green-600">R$ {(empresaSelecionada.valorPlano || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(empresaSelecionada)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiração</p>
                  <p className="font-medium">
                    {empresaSelecionada.dataExpiracao 
                      ? format(new Date(empresaSelecionada.dataExpiracao), "dd/MM/yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalhes(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditar} onOpenChange={setDialogEditar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Altere os dados da empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={editarEmpresa.nome} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editarEmpresa.cnpj} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, cnpj: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editarEmpresa.telefone} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, telefone: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email</Label>
                <Input type="email" value={editarEmpresa.email} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Plano</Label>
                <Select value={editarEmpresa.plano} onValueChange={(v) => setEditarEmpresa({ ...editarEmpresa, plano: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_PLANO.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" value={editarEmpresa.valorPlano} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, valorPlano: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editarEmpresa.status} onValueChange={(v) => setEditarEmpresa({ ...editarEmpresa, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Expiração</Label>
                <Input type="date" value={editarEmpresa.dataExpiracao} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, dataExpiracao: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Nova Senha (deixe vazio para manter)</Label>
                <Input type="password" value={editarEmpresa.senha} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, senha: e.target.value })} placeholder="••••••" />
              </div>
              {editarEmpresa.senha && (
                <div className="space-y-2 col-span-2">
                  <Label>Confirmar Senha</Label>
                  <Input type="password" value={editarEmpresa.confirmarSenha} onChange={(e) => setEditarEmpresa({ ...editarEmpresa, confirmarSenha: e.target.value })} placeholder="••••••" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditar(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Configurar Plano */}
      <Dialog open={dialogConfigPlano} onOpenChange={setDialogConfigPlano}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Plano</DialogTitle>
            <DialogDescription>Defina o valor e limites do plano para {planoConfig.nomeEmpresa}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Plano</Label>
              <Select value={planoConfig.plano} onValueChange={(v) => setPlanoConfig({ ...planoConfig, plano: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_PLANO.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} - {p.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mensal (R$)</Label>
                <Input 
                  type="number" 
                  value={planoConfig.valorMensal} 
                  onChange={(e) => {
                    const mensal = parseFloat(e.target.value) || 0;
                    setPlanoConfig({ 
                      ...planoConfig, 
                      valorMensal: e.target.value,
                      valorAnual: String(mensal * 12 * 0.9)
                    });
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Anual (R$)</Label>
                <Input type="number" value={planoConfig.valorAnual} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite de Produtos</Label>
                <Input type="number" value={planoConfig.limiteProdutos} onChange={(e) => setPlanoConfig({ ...planoConfig, limiteProdutos: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Limite de Usuários</Label>
                <Input type="number" value={planoConfig.limiteUsuarios} onChange={(e) => setPlanoConfig({ ...planoConfig, limiteUsuarios: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Expiração</Label>
              <Input type="date" value={planoConfig.dataExpiracao} onChange={(e) => setPlanoConfig({ ...planoConfig, dataExpiracao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConfigPlano(false)}>Cancelar</Button>
            <Button onClick={handleSalvarConfigPlano} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Popular Dados */}
      <Dialog open={dialogPopularDados} onOpenChange={setDialogPopularDados}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar População de Dados</DialogTitle>
            <DialogDescription>
              Você está prestes a popular dados para a empresa selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-blue-800">Resumo da operação:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Empresa: <strong>{tenants.find(t => t.id === selectedTenantId)?.nome}</strong></li>
                <li>• Período: <strong>Últimos {periodoDados === '1m' ? '1' : periodoDados === '3m' ? '3' : periodoDados === '6m' ? '6' : '12'} meses</strong></li>
                <li>• Produtos: <strong>{quantidadeProdutos}</strong></li>
                <li>• Clientes: <strong>{quantidadeClientes}</strong></li>
                <li>• Vendas: <strong>{quantidadeVendas}</strong></li>
                <li>• Limpar antes: <strong>{limparAntesPopular ? 'Sim' : 'Não'}</strong></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPopularDados(false)}>Cancelar</Button>
            <Button onClick={handlePopularDadosPersonalizado} disabled={populatingData} className="bg-blue-600 hover:bg-blue-700">
              {populatingData ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              {populatingData ? 'Populando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
