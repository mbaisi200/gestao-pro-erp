'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Venda } from '@/types';
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Package,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VendasPage() {
  const { tenant, user } = useAuthStore();
  const { vendas, clientes } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      const cliente = clientes.find(c => c.id === venda.clienteId);
      const matchSearch = cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.numero.toString().includes(searchTerm);
      const matchStatus = statusFilter === 'todos' || venda.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vendas, searchTerm, statusFilter, clientes]);

  const vendasConcluidas = vendas.filter(v => v.status === 'concluida');
  const vendasPendentes = vendas.filter(v => v.status === 'pendente');
  const totalVendas = vendas.reduce((acc, v) => acc + v.total, 0);
  const totalVendasConcluidas = vendasConcluidas.reduce((acc, v) => acc + v.total, 0);

  const getStatusBadge = (status: Venda['status']) => {
    switch (status) {
      case 'concluida':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormaPagamentoBadge = (forma: Venda['formaPagamento']) => {
    const formas: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão Crédito',
      'cartao_debito': 'Cartão Débito',
      'pix': 'PIX',
      'boleto': 'Boleto'
    };
    return formas[forma] || forma;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="text-gray-600">Gestão de vendas consolidadas</p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendas)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{vendas.length} vendas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vendas Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendasConcluidas)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{vendasConcluidas.length} vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vendas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendasPendentes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Aguardando conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por cliente ou número</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite o nome do cliente ou número da venda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="concluida">Concluída</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
            <CardDescription>
              Exibindo {filteredVendas.length} de {vendas.length} vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.length > 0 ? (
                    filteredVendas.map((venda) => {
                      const cliente = clientes.find(c => c.id === venda.clienteId);
                      return (
                        <TableRow key={venda.id}>
                          <TableCell className="font-medium">#{venda.numero}</TableCell>
                          <TableCell>{cliente?.nome || 'Cliente Desconhecido'}</TableCell>
                          <TableCell>
                            {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.total)}
                          </TableCell>
                          <TableCell>{getFormaPagamentoBadge(venda.formaPagamento)}</TableCell>
                          <TableCell>{getStatusBadge(venda.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVenda(venda);
                                setDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Dialog de Detalhes */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda #{selectedVenda?.numero}</DialogTitle>
            </DialogHeader>

            {selectedVenda && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Cliente</Label>
                    <p className="font-medium">
                      {clientes.find(c => c.id === selectedVenda.clienteId)?.nome || 'Cliente Desconhecido'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Data</Label>
                    <p className="font-medium">
                      {new Date(selectedVenda.dataVenda).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Forma de Pagamento</Label>
                    <p className="font-medium">{getFormaPagamentoBadge(selectedVenda.formaPagamento)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedVenda.status)}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-gray-600 mb-2 block">Itens</Label>
                  <div className="space-y-2">
                    {selectedVenda.itens.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{item.produto?.nome || 'Produto'}</span>
                        <span>{item.quantidade} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedVenda.subtotal)}</span>
                  </div>
                  {selectedVenda.desconto > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto:</span>
                      <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedVenda.desconto)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedVenda.total)}</span>
                  </div>
                </div>

                {selectedVenda.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-gray-600">Observações</Label>
                      <p className="text-sm mt-1">{selectedVenda.observacoes}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
