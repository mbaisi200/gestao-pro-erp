'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { OrdemServico } from '@/types';
import {
  Wrench,
  Search,
  Loader2,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle,
  ArrowRight,
  Edit,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OperacionalPage() {
  const { tenant } = useAuthStore();
  const { ordensServico, clientes, addOrdemServico, updateOrdemServico, deleteOrdemServico } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const filteredOS = useMemo(() => {
    return ordensServico.filter(os => {
      if (!os.ativo) return false;
      const matchSearch = os.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.numero.toString().includes(searchTerm);
      const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [ordensServico, searchTerm, statusFilter]);

  const osAbertas = ordensServico.filter(os => os.ativo && os.status === 'aberta');
  const osEmAndamento = ordensServico.filter(os => os.ativo && os.status === 'em_andamento');
  const osConcluidas = ordensServico.filter(os => os.ativo && os.status === 'concluida');
  const osAprovadas = ordensServico.filter(os => os.ativo && os.status === 'aprovada');

  const proximoNumero = useMemo(() => {
    const numeros = ordensServico.map(os => os.numero);
    return numeros.length > 0 ? Math.max(...numeros) + 1 : 1001;
  }, [ordensServico]);

  const handleStatusChange = async (osId: string, novoStatus: OrdemServico['status']) => {
    try {
      await updateOrdemServico(osId, { status: novoStatus });
      toast({ title: 'Status atualizado!', description: 'O status da OS foi alterado com sucesso.' });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o status.' });
    }
  };

  const handleSaveOS = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const clienteId = formData.get('clienteId') as string;
      const clienteSelecionado = clientes.find(c => c.id === clienteId);
      const valorTotal = parseFloat(formData.get('valorTotal') as string) || 0;
      
      const osData: OrdemServico = {
        id: editingOS?.id || `os-${Date.now()}`,
        tenantId: tenant?.id || '',
        numero: editingOS?.numero || proximoNumero,
        clienteId,
        cliente: clienteSelecionado,
        descricao: formData.get('descricao') as string,
        tecnico: formData.get('tecnico') as string || '',
        status: (formData.get('status') as OrdemServico['status']) || 'aberta',
        dataAbertura: editingOS?.dataAbertura || new Date(),
        dataPrevisao: formData.get('dataPrevisao') ? new Date(formData.get('dataPrevisao') as string) : undefined,
        valorTotal,
        servicos: [{ descricao: formData.get('descricao') as string, quantidade: 1, valorUnitario: valorTotal, total: valorTotal }],
        observacoes: formData.get('observacoes') as string || '',
        ativo: true,
      };

      if (editingOS) {
        await updateOrdemServico(editingOS.id, osData);
        toast({ title: 'OS atualizada!', description: 'A ordem de serviço foi atualizada.' });
      } else {
        await addOrdemServico(osData);
        toast({ title: 'OS criada!', description: 'Nova ordem de serviço criada.' });
      }
      setFormOpen(false);
      setEditingOS(null);
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a OS.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOS = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta OS?')) {
      try {
        await deleteOrdemServico(id);
        toast({ title: 'OS excluída!', description: 'Ordem de serviço removida.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir.' });
      }
    }
  };

  const getStatusBadge = (status: OrdemServico['status']) => {
    switch (status) {
      case 'aberta': return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Aberta</Badge>;
      case 'em_andamento': return <Badge className="bg-blue-500"><PlayCircle className="h-3 w-3 mr-1" />Em Andamento</Badge>;
      case 'concluida': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Concluída</Badge>;
      case 'aprovada': return <Badge className="bg-violet-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'cancelada': return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout breadcrumbs={[{ title: 'Admin' }, { title: 'Operacional' }]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
            <p className="text-muted-foreground">Gerencie ordens de serviço</p>
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingOS(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-500 to-purple-600"><Plus className="mr-2 h-4 w-4" />Nova OS</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingOS ? 'Editar OS' : 'Nova Ordem de Serviço'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveOS} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input value={editingOS?.numero || proximoNumero} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select name="clienteId" defaultValue={editingOS?.clienteId || ''} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{clientes.map(c => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Textarea name="descricao" placeholder="Descrição do serviço..." defaultValue={editingOS?.descricao} required rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Técnico</Label>
                      <Input name="tecnico" placeholder="Nome do técnico" defaultValue={editingOS?.tecnico} />
                    </div>
                    <div className="space-y-2">
                      <Label>Previsão</Label>
                      <Input name="dataPrevisao" type="date" defaultValue={editingOS?.dataPrevisao ? new Date(editingOS.dataPrevisao).toISOString().split('T')[0] : ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input name="valorTotal" type="number" step="0.01" placeholder="0,00" defaultValue={editingOS?.valorTotal || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select name="status" defaultValue={editingOS?.status || 'aberta'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberta">Aberta</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="aprovada">Aprovada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea name="observacoes" placeholder="Observações..." defaultValue={editingOS?.observacoes} rows={2} />
                  </div>
                </div>
                <DialogFooter className="shrink-0 pt-4 border-t">
                  <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingOS ? 'Atualizar' : 'Criar OS'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Abertas</p><p className="text-2xl font-bold">{osAbertas.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center"><PlayCircle className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Em Andamento</p><p className="text-2xl font-bold">{osEmAndamento.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Concluídas</p><p className="text-2xl font-bold">{osConcluidas.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center"><Wrench className="h-6 w-6 text-violet-600" /></div><div><p className="text-sm text-muted-foreground">Aprovadas</p><p className="text-2xl font-bold">{osAprovadas.length}</p></div></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ordens de Serviço</CardTitle><CardDescription>{filteredOS.length} encontrada(s)</CardDescription></CardHeader>
          <CardContent>
            {filteredOS.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Nenhuma OS encontrada</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOS.map((os) => (
                      <TableRow key={os.id}>
                        <TableCell className="font-mono font-semibold">#{os.numero}</TableCell>
                        <TableCell><p className="font-medium">{os.cliente?.nome || 'Cliente'}</p>{os.tecnico && <p className="text-xs text-muted-foreground">Técnico: {os.tecnico}</p>}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{os.descricao}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {os.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{getStatusBadge(os.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setEditingOS(os); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedOS(os); setDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteOS(os.id)}><Trash2 className="h-4 w-4" /></Button>
                            {os.status === 'aberta' && <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleStatusChange(os.id, 'em_andamento')}><PlayCircle className="h-4 w-4" /></Button>}
                            {os.status === 'em_andamento' && <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(os.id, 'concluida')}><CheckCircle className="h-4 w-4" /></Button>}
                            {os.status === 'concluida' && <Button size="sm" variant="outline" className="text-violet-600" onClick={() => handleStatusChange(os.id, 'aprovada')}><CheckCircle className="h-4 w-4" /></Button>}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>OS #{selectedOS?.numero}</DialogTitle></DialogHeader>
          {selectedOS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Cliente</Label><p className="font-medium">{selectedOS.cliente?.nome || 'Cliente'}</p></div>
                <div><Label className="text-muted-foreground">Técnico</Label><p className="font-medium">{selectedOS.tecnico || 'Não atribuído'}</p></div>
                <div><Label className="text-muted-foreground">Abertura</Label><p className="font-medium">{new Date(selectedOS.dataAbertura).toLocaleDateString('pt-BR')}</p></div>
                <div><Label className="text-muted-foreground">Previsão</Label><p className="font-medium">{selectedOS.dataPrevisao ? new Date(selectedOS.dataPrevisao).toLocaleDateString('pt-BR') : '-'}</p></div>
              </div>
              <div><Label className="text-muted-foreground">Descrição</Label><p>{selectedOS.descricao}</p></div>
              <div className="flex justify-between items-center pt-2 border-t"><span className="font-medium">Valor Total:</span><span className="text-2xl font-bold">R$ {selectedOS.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              {selectedOS.observacoes && <div><Label className="text-muted-foreground">Observações</Label><p>{selectedOS.observacoes}</p></div>}
              <div className="flex justify-end">{getStatusBadge(selectedOS.status)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
