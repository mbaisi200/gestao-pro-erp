'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { ContaPagar, ContaReceber } from '@/types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SortField = 'descricao' | 'categoria' | 'vencimento' | 'valor' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'todos' | 'vencidos' | 'pagos' | 'pendentes';

export default function FinanceiroPage() {
  const { tenant } = useAuthStore();
  const { contasPagar, contasReceber, addContaPagar, addContaReceber, pagarConta, receberConta } = useAppStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tipoConta, setTipoConta] = useState<'pagar' | 'receber'>('pagar');
  
  // Ordenação
  const [sortFieldPagar, setSortFieldPagar] = useState<SortField>('vencimento');
  const [sortDirectionPagar, setSortDirectionPagar] = useState<SortDirection>('asc');
  const [sortFieldReceber, setSortFieldReceber] = useState<SortField>('vencimento');
  const [sortDirectionReceber, setSortDirectionReceber] = useState<SortDirection>('asc');
  
  // Filtros
  const [filtroStatusPagar, setFiltroStatusPagar] = useState<StatusFilter>('todos');
  const [filtroStatusReceber, setFiltroStatusReceber] = useState<StatusFilter>('todos');
  
  const { toast } = useToast();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Função para ordenar contas
  const sortContas = <T extends ContaPagar | ContaReceber>(
    contas: T[],
    field: SortField,
    direction: SortDirection
  ): T[] => {
    return [...contas].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (field) {
        case 'descricao':
          valueA = a.descricao.toLowerCase();
          valueB = b.descricao.toLowerCase();
          break;
        case 'categoria':
          valueA = (a.categoria || '').toLowerCase();
          valueB = (b.categoria || '').toLowerCase();
          break;
        case 'vencimento':
          valueA = a.vencimento ? new Date(a.vencimento).getTime() : Infinity;
          valueB = b.vencimento ? new Date(b.vencimento).getTime() : Infinity;
          break;
        case 'valor':
          valueA = a.valor;
          valueB = b.valor;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para filtrar contas
  const filterContas = <T extends ContaPagar | ContaReceber>(
    contas: T[],
    filtro: StatusFilter
  ): T[] => {
    switch (filtro) {
      case 'vencidos':
        return contas.filter(c => 
          c.status === 'vencido' || 
          (c.vencimento && new Date(c.vencimento) < hoje && (c.status === 'pendente'))
        );
      case 'pagos':
        return contas.filter(c => c.status === 'pago' || c.status === 'recebido');
      case 'pendentes':
        return contas.filter(c => c.status === 'pendente' || c.status === 'vencido');
      default:
        return contas;
    }
  };

  // Contas filtradas e ordenadas
  const contasPagarFiltradas = useMemo(() => {
    const filtradas = filterContas(contasPagar, filtroStatusPagar);
    return sortContas(filtradas, sortFieldPagar, sortDirectionPagar);
  }, [contasPagar, filtroStatusPagar, sortFieldPagar, sortDirectionPagar]);

  const contasReceberFiltradas = useMemo(() => {
    const filtradas = filterContas(contasReceber, filtroStatusReceber);
    return sortContas(filtradas, sortFieldReceber, sortDirectionReceber);
  }, [contasReceber, filtroStatusReceber, sortFieldReceber, sortDirectionReceber]);

  // Calcular totais
  const totalPagarPendente = useMemo(() => 
    contasPagar.filter(c => c.status === 'pendente' || c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0),
    [contasPagar]
  );
  
  const totalReceberPendente = useMemo(() => 
    contasReceber.filter(c => c.status === 'pendente' || c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0),
    [contasReceber]
  );
  
  const totalPago = useMemo(() => 
    contasPagar.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0),
    [contasPagar]
  );
  
  const totalRecebido = useMemo(() => 
    contasReceber.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor, 0),
    [contasReceber]
  );

  const saldoProjetado = totalReceberPendente - totalPagarPendente;

  const contasVencidas = [...contasPagar.filter(c => c.status === 'vencido' || (c.vencimento && new Date(c.vencimento) < hoje && c.status === 'pendente')), ...contasReceber.filter(c => c.status === 'vencido' || (c.vencimento && new Date(c.vencimento) < hoje && c.status === 'pendente'))];

  // Toggle sort
  const toggleSort = (field: SortField, tipo: 'pagar' | 'receber') => {
    if (tipo === 'pagar') {
      if (sortFieldPagar === field) {
        setSortDirectionPagar(sortDirectionPagar === 'asc' ? 'desc' : 'asc');
      } else {
        setSortFieldPagar(field);
        setSortDirectionPagar('asc');
      }
    } else {
      if (sortFieldReceber === field) {
        setSortDirectionReceber(sortDirectionReceber === 'asc' ? 'desc' : 'asc');
      } else {
        setSortFieldReceber(field);
        setSortDirectionReceber('asc');
      }
    }
  };

  // Exportar PDF
  const exportarPDF = (tipo: 'pagar' | 'receber') => {
    const contas = tipo === 'pagar' ? contasPagarFiltradas : contasReceberFiltradas;
    const total = tipo === 'pagar' ? totalPagarPendente : totalReceberPendente;
    
    // Criar conteúdo HTML para impressão/PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - Contas a ${tipo === 'pagar' ? 'Pagar' : 'Receber'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
          .header-info { margin-bottom: 20px; }
          .status-pago { color: #22c55e; }
          .status-pendente { color: #3b82f6; }
          .status-vencido { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>Relatório - Contas a ${tipo === 'pagar' ? 'Pagar' : 'Receber'}</h1>
        <div class="header-info">
          <p><strong>Empresa:</strong> ${tenant?.nome || 'N/A'}</p>
          <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          <p><strong>Filtro:</strong> ${tipo === 'pagar' ? (filtroStatusPagar === 'todos' ? 'Todos' : filtroStatusPagar === 'vencidos' ? 'Vencidos' : filtroStatusPagar === 'pagos' ? 'Pagos' : 'Pendentes') : (filtroStatusReceber === 'todos' ? 'Todos' : filtroStatusReceber === 'vencidos' ? 'Vencidos' : filtroStatusReceber === 'pagos' ? 'Recebidos' : 'Pendentes')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${contas.map(c => `
              <tr>
                <td>${c.descricao}</td>
                <td>${c.categoria || '-'}</td>
                <td>${c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                <td>R$ ${c.valor.toFixed(2)}</td>
                <td class="status-${c.status}">${c.status === 'pago' || c.status === 'recebido' ? (tipo === 'pagar' ? 'Pago' : 'Recebido') : c.status === 'vencido' ? 'Vencido' : 'Pendente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: 'PDF gerado!',
      description: 'O relatório foi gerado com sucesso.',
    });
  };

  const handleSalvarConta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const vencimentoStr = formData.get('vencimento') as string;
      const vencimento = vencimentoStr ? new Date(vencimentoStr + 'T00:00:00') : undefined;
      
      if (tipoConta === 'pagar') {
        const conta: ContaPagar = {
          id: `pagar-${Date.now()}`,
          tenantId: tenant?.id || '',
          descricao: formData.get('descricao') as string,
          valor: parseFloat(formData.get('valor') as string) || 0,
          vencimento,
          categoria: formData.get('categoria') as string,
          fornecedor: formData.get('fornecedor') as string,
          status: 'pendente',
          dataCriacao: new Date(),
        };
        await addContaPagar(conta);
      } else {
        const conta: ContaReceber = {
          id: `receber-${Date.now()}`,
          tenantId: tenant?.id || '',
          descricao: formData.get('descricao') as string,
          valor: parseFloat(formData.get('valor') as string) || 0,
          vencimento,
          categoria: formData.get('categoria') as string,
          cliente: formData.get('fornecedor') as string,
          status: 'pendente',
          dataCriacao: new Date(),
        };
        await addContaReceber(conta);
      }

      toast({
        title: 'Conta cadastrada!',
        description: `A conta a ${tipoConta} foi adicionada com sucesso.`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível cadastrar a conta.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrarPagamento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const formaPagamento = formData.get('formaPagamento') as string;
    
    try {
      if (contaSelecionada.tipo === 'pagar') {
        await pagarConta(contaSelecionada.id, new Date(), formaPagamento);
      } else {
        await receberConta(contaSelecionada.id, new Date(), formaPagamento);
      }

      toast({
        title: 'Pagamento registrado!',
        description: 'O pagamento foi registrado com sucesso.',
      });

      setDialogPagamentoOpen(false);
      setContaSelecionada(null);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (conta: any) => {
    if (conta.status === 'pago' || conta.status === 'recebido') {
      return <Badge className="bg-green-500">Pago</Badge>;
    }
    
    if (conta.status === 'vencido' || (conta.vencimento && new Date(conta.vencimento) < hoje)) {
      return <Badge className="bg-red-500">Vencida</Badge>;
    }
    
    const diasVencimento = conta.vencimento 
      ? Math.ceil((new Date(conta.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    if (diasVencimento !== null && diasVencimento <= 3) {
      return <Badge className="bg-yellow-500">Vence em {diasVencimento}d</Badge>;
    }
    
    return <Badge className="bg-blue-500">Pendente</Badge>;
  };

  const SortIcon = ({ field, tipo }: { field: SortField; tipo: 'pagar' | 'receber' }) => {
    const currentField = tipo === 'pagar' ? sortFieldPagar : sortFieldReceber;
    const currentDirection = tipo === 'pagar' ? sortDirectionPagar : sortDirectionReceber;
    
    if (currentField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return currentDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Financeiro' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Área Financeira</h1>
            <p className="text-muted-foreground">
              Gerencie o fluxo de caixa e contas do estabelecimento
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Conta</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta a pagar ou receber
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSalvarConta}>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={tipoConta === 'pagar' ? 'default' : 'outline'}
                      className={tipoConta === 'pagar' ? 'bg-red-500 hover:bg-red-600' : ''}
                      onClick={() => setTipoConta('pagar')}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      A Pagar
                    </Button>
                    <Button
                      type="button"
                      variant={tipoConta === 'receber' ? 'default' : 'outline'}
                      className={tipoConta === 'receber' ? 'bg-green-500 hover:bg-green-600' : ''}
                      onClick={() => setTipoConta('receber')}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-2" />
                      A Receber
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input id="descricao" name="descricao" placeholder="Ex: Aluguel do mês" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$) *</Label>
                      <Input id="valor" name="valor" type="number" step="0.01" placeholder="0,00" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vencimento">Vencimento</Label>
                      <Input id="vencimento" name="vencimento" type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select name="categoria">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoConta === 'pagar' ? (
                            <>
                              <SelectItem value="fornecedores">Fornecedores</SelectItem>
                              <SelectItem value="aluguel">Aluguel</SelectItem>
                              <SelectItem value="funcionarios">Funcionários</SelectItem>
                              <SelectItem value="impostos">Impostos</SelectItem>
                              <SelectItem value="servicos">Serviços</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="vendas">Vendas</SelectItem>
                              <SelectItem value="servicos">Serviços</SelectItem>
                              <SelectItem value="aluguel">Aluguel Recebido</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">
                        {tipoConta === 'pagar' ? 'Fornecedor' : 'Cliente'}
                      </Label>
                      <Input 
                        id="fornecedor" 
                        name="fornecedor" 
                        placeholder={tipoConta === 'pagar' ? 'Nome do fornecedor' : 'Nome do cliente'} 
                      />
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

        {/* Alerta de contas vencidas */}
        {contasVencidas.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">
                    Atenção: {contasVencidas.length} conta(s) vencida(s)
                  </p>
                  <p className="text-sm text-red-700">
                    Você tem {contasVencidas.length} conta(s) com vencimento ultrapassado. Regularize o quanto antes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totalPagarPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {totalReceberPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${saldoProjetado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Wallet className={`h-6 w-6 ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                  <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="visao" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visao">Visão Geral</TabsTrigger>
            <TabsTrigger value="pagar">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              A Pagar ({contasPagar.length})
            </TabsTrigger>
            <TabsTrigger value="receber">
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              A Receber ({contasReceber.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="visao" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pendente</span>
                      <span className="font-semibold text-red-600">
                        R$ {totalPagarPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pago</span>
                      <span className="font-semibold text-green-600">
                        R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo a Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pendente</span>
                      <span className="font-semibold text-blue-600">
                        R$ {totalReceberPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recebido</span>
                      <span className="font-semibold text-green-600">
                        R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab A Pagar */}
          <TabsContent value="pagar">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>Gerencie suas despesas e pagamentos</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filtroStatusPagar} onValueChange={(v) => setFiltroStatusPagar(v as StatusFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendentes">Pendentes</SelectItem>
                      <SelectItem value="vencidos">Vencidos</SelectItem>
                      <SelectItem value="pagos">Pagos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportarPDF('pagar')}>
                    <FileDown className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contasPagarFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowUpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conta a pagar</p>
                    <p className="text-sm">Clique em &quot;Nova Conta&quot; para adicionar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('descricao', 'pagar')}>
                            <div className="flex items-center">Descrição <SortIcon field="descricao" tipo="pagar" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('categoria', 'pagar')}>
                            <div className="flex items-center">Categoria <SortIcon field="categoria" tipo="pagar" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('vencimento', 'pagar')}>
                            <div className="flex items-center">Vencimento <SortIcon field="vencimento" tipo="pagar" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('valor', 'pagar')}>
                            <div className="flex items-center">Valor <SortIcon field="valor" tipo="pagar" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('status', 'pagar')}>
                            <div className="flex items-center">Status <SortIcon field="status" tipo="pagar" /></div>
                          </TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasPagarFiltradas.map((conta) => (
                          <TableRow key={conta.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{conta.descricao}</p>
                                {conta.fornecedor && (
                                  <p className="text-sm text-muted-foreground">{conta.fornecedor}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{conta.categoria || '-'}</TableCell>
                            <TableCell>
                              {conta.vencimento ? new Date(conta.vencimento).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              R$ {conta.valor.toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(conta)}</TableCell>
                            <TableCell className="text-right">
                              {(conta.status === 'pendente' || conta.status === 'vencido') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setContaSelecionada({ ...conta, tipo: 'pagar' });
                                    setDialogPagamentoOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Pagar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab A Receber */}
          <TabsContent value="receber">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Gerencie seus recebíveis</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filtroStatusReceber} onValueChange={(v) => setFiltroStatusReceber(v as StatusFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendentes">Pendentes</SelectItem>
                      <SelectItem value="vencidos">Vencidos</SelectItem>
                      <SelectItem value="pagos">Recebidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportarPDF('receber')}>
                    <FileDown className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contasReceberFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowDownCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conta a receber</p>
                    <p className="text-sm">Clique em &quot;Nova Conta&quot; para adicionar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('descricao', 'receber')}>
                            <div className="flex items-center">Descrição <SortIcon field="descricao" tipo="receber" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('categoria', 'receber')}>
                            <div className="flex items-center">Categoria <SortIcon field="categoria" tipo="receber" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('vencimento', 'receber')}>
                            <div className="flex items-center">Vencimento <SortIcon field="vencimento" tipo="receber" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('valor', 'receber')}>
                            <div className="flex items-center">Valor <SortIcon field="valor" tipo="receber" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('status', 'receber')}>
                            <div className="flex items-center">Status <SortIcon field="status" tipo="receber" /></div>
                          </TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasReceberFiltradas.map((conta) => (
                          <TableRow key={conta.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{conta.descricao}</p>
                                {conta.cliente && (
                                  <p className="text-sm text-muted-foreground">{conta.cliente}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{conta.categoria || '-'}</TableCell>
                            <TableCell>
                              {conta.vencimento ? new Date(conta.vencimento).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              R$ {conta.valor.toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(conta)}</TableCell>
                            <TableCell className="text-right">
                              {(conta.status === 'pendente' || conta.status === 'vencido') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setContaSelecionada({ ...conta, tipo: 'receber' });
                                    setDialogPagamentoOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Receber
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Pagamento */}
      <Dialog open={dialogPagamentoOpen} onOpenChange={setDialogPagamentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contaSelecionada?.tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
            </DialogTitle>
            <DialogDescription>
              {contaSelecionada?.descricao} - R$ {contaSelecionada?.valor?.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegistrarPagamento}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor a {contaSelecionada?.tipo === 'pagar' ? 'Pagar' : 'Receber'}</Label>
                <Input 
                  id="valor" 
                  name="valor" 
                  type="number" 
                  step="0.01"
                  defaultValue={contaSelecionada?.valor}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select name="formaPagamento" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        PIX
                      </div>
                    </SelectItem>
                    <SelectItem value="credito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito
                      </div>
                    </SelectItem>
                    <SelectItem value="debito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogPagamentoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
