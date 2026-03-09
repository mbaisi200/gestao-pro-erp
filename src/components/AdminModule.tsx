'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Users, Building, Database, Calendar, AlertTriangle, 
  CheckCircle, Loader2, Key, DollarSign, TrendingUp, UserPlus, RefreshCw
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tenant, Vendedor } from '@/types';
import { 
  getAllTenants, createNewTenant, updateTenant, updateTenantStatus, deleteTenant,
  getVendedores, createVendedor, updateVendedor, deleteVendedor,
  populateTenantData, PopulateOptions,
  daysUntilExpiration, isTenantExpired,
  VendedorRelatorio, getRelatorioVendedores
} from '@/lib/admin-service';

export function AdminModule() {
  const [activeTab, setActiveTab] = useState('tenants');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Building size={16} /> Clientes
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <Users size={16} /> Vendedores
          </TabsTrigger>
          <TabsTrigger value="populate" className="flex items-center gap-2">
            <Database size={16} /> Popular Dados
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <TrendingUp size={16} /> Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="mt-6">
          <TenantsTab />
        </TabsContent>

        <TabsContent value="vendedores" className="mt-6">
          <VendedoresTab />
        </TabsContent>

        <TabsContent value="populate" className="mt-6">
          <PopulateTab />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <RelatoriosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== TENANTS TAB ==========
function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tenantData = {
      nome: formData.get('nome') as string,
      cnpj: formData.get('cnpj') as string,
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
      plano: formData.get('plano') as 'basico' | 'profissional' | 'enterprise',
      dataExpiracao: new Date(formData.get('dataExpiracao') as string)
    };

    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, tenantData);
      } else {
        await createNewTenant(tenantData);
      }
      await loadTenants();
      setDialogOpen(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Erro ao salvar tenant:', error);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        await deleteTenant(tenantId);
        await loadTenants();
      } catch (error) {
        console.error('Erro ao excluir tenant:', error);
      }
    }
  };

  const handleStatusChange = async (tenantId: string, status: Tenant['status']) => {
    try {
      await updateTenantStatus(tenantId, status);
      await loadTenants();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Clientes (Empresas)</h3>
          <p className="text-sm text-gray-500">Gerencie os clientes do sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTenant(null)}>
              <Plus size={18} className="mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTenant ? 'Editar' : 'Novo'} Cliente</DialogTitle>
              <DialogDescription>Preencha os dados do cliente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input id="nome" name="nome" defaultValue={editingTenant?.nome} required />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input id="cnpj" name="cnpj" defaultValue={editingTenant?.cnpj} placeholder="00.000.000/0000-00" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingTenant?.email} required />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input id="telefone" name="telefone" defaultValue={editingTenant?.telefone} placeholder="(00) 00000-0000" required />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Endereço</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="logradouro">Logradouro *</Label>
                    <Input id="logradouro" name="logradouro" defaultValue={editingTenant?.endereco?.logradouro} required />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input id="numero" name="numero" defaultValue={editingTenant?.endereco?.numero} required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" name="complemento" defaultValue={editingTenant?.endereco?.complemento} />
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input id="bairro" name="bairro" defaultValue={editingTenant?.endereco?.bairro} required />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input id="cep" name="cep" defaultValue={editingTenant?.endereco?.cep} placeholder="00000-000" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input id="cidade" name="cidade" defaultValue={editingTenant?.endereco?.cidade} required />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select name="estado" defaultValue={editingTenant?.endereco?.estado || 'SP'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Assinatura</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plano">Plano *</Label>
                    <Select name="plano" defaultValue={editingTenant?.plano || 'profissional'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dataExpiracao">Data de Expiração *</Label>
                    <Input 
                      id="dataExpiracao" 
                      name="dataExpiracao" 
                      type="date" 
                      defaultValue={editingTenant?.dataExpiracao ? format(new Date(editingTenant.dataExpiracao), 'yyyy-MM-dd') : format(addMonths(new Date(), 1), 'yyyy-MM-dd')}
                      required 
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const expired = isTenantExpired(tenant.dataExpiracao);
                const daysLeft = daysUntilExpiration(tenant.dataExpiracao);
                
                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.nome}</p>
                        <p className="text-xs text-gray-500">{tenant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{tenant.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.plano.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span className={expired ? 'text-red-600 font-medium' : daysLeft <= 7 ? 'text-orange-600' : ''}>
                          {format(new Date(tenant.dataExpiracao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {expired && <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={tenant.status} 
                        onValueChange={(value) => handleStatusChange(tenant.id, value as Tenant['status'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                          <SelectItem value="expirado">Expirado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => { setEditingTenant(tenant); setDialogOpen(true); }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600"
                        onClick={() => handleDelete(tenant.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
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

// ========== VENDEDORES TAB ==========
function VendedoresTab() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadVendedores();
    }
  }, [selectedTenantId]);

  const loadTenants = async () => {
    try {
      const data = await getAllTenants();
      setTenants(data.filter(t => t.status === 'ativo'));
      if (data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const loadVendedores = async () => {
    if (!selectedTenantId) return;
    setLoading(true);
    try {
      const data = await getVendedores(selectedTenantId);
      setVendedores(data);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    const formData = new FormData(e.currentTarget);
    const vendedorData = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      cpf: formData.get('cpf') as string,
      senha: formData.get('senha') as string,
      comissao: Number(formData.get('comissao')),
      metaVendas: Number(formData.get('metaVendas')),
      ativo: formData.get('ativo') === 'true'
    };

    try {
      if (editingVendedor) {
        // Se não preencheu senha nova, não atualiza
        if (!vendedorData.senha) {
          delete (vendedorData as Partial<Vendedor>).senha;
        }
        await updateVendedor(selectedTenantId, editingVendedor.id, vendedorData);
      } else {
        await createVendedor(selectedTenantId, vendedorData);
      }
      await loadVendedores();
      setDialogOpen(false);
      setEditingVendedor(null);
    } catch (error) {
      console.error('Erro ao salvar vendedor:', error);
    }
  };

  const handleDelete = async (vendedorId: string) => {
    if (confirm('Tem certeza que deseja excluir este vendedor?')) {
      try {
        await deleteVendedor(selectedTenantId, vendedorId);
        await loadVendedores();
      } catch (error) {
        console.error('Erro ao excluir vendedor:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Vendedores</h3>
          <p className="text-sm text-gray-500">Gerencie os vendedores de cada cliente</p>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} disabled={!selectedTenantId}>
            <Plus size={18} className="mr-2" /> Novo Vendedor
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVendedor ? 'Editar' : 'Novo'} Vendedor</DialogTitle>
            <DialogDescription>
              {editingVendedor ? 'Edite os dados do vendedor' : 'Preencha os dados do novo vendedor'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input name="nome" defaultValue={editingVendedor?.nome} required />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input name="cpf" defaultValue={editingVendedor?.cpf} placeholder="000.000.000-00" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input name="email" type="email" defaultValue={editingVendedor?.email} required />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input name="telefone" defaultValue={editingVendedor?.telefone} placeholder="(00) 00000-0000" required />
              </div>
            </div>

            <div>
              <Label>Senha {editingVendedor ? '(deixe vazio para manter)' : '*'}</Label>
              <Input 
                name="senha" 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                required={!editingVendedor}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Comissão (%) *</Label>
                <Input name="comissao" type="number" step="0.1" defaultValue={editingVendedor?.comissao || 5} required />
              </div>
              <div>
                <Label>Meta de Vendas (R$) *</Label>
                <Input name="metaVendas" type="number" defaultValue={editingVendedor?.metaVendas || 10000} required />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo" name="ativo" value="true" defaultChecked={!editingVendedor || editingVendedor.ativo} />
              <Label htmlFor="ativo">Vendedor ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingVendedor(null); }}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !selectedTenantId ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Selecione um cliente</AlertTitle>
          <AlertDescription>Selecione um cliente acima para gerenciar seus vendedores</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum vendedor cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  vendedores.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{v.nome}</p>
                          <p className="text-xs text-gray-500">{v.cpf}</p>
                        </div>
                      </TableCell>
                      <TableCell>{v.email}</TableCell>
                      <TableCell>{v.comissao}%</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.metaVendas)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.ativo ? 'default' : 'secondary'}>
                          {v.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setEditingVendedor(v); setDialogOpen(true); }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600"
                          onClick={() => handleDelete(v.id)}
                        >
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
      )}
    </div>
  );
}

// ========== POPULATE TAB ==========
function PopulateTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handlePopulate = async () => {
    if (!selectedTenantId) {
      setResult('Selecione um cliente');
      return;
    }

    const dataInicioInput = document.getElementById('dataInicio') as HTMLInputElement;
    const dataFimInput = document.getElementById('dataFim') as HTMLInputElement;

    if (!dataInicioInput?.value || !dataFimInput?.value) {
      setResult('Selecione o período');
      return;
    }

    setLoading(true);
    setResult('⏳ Populando dados... Isso pode levar alguns segundos.');

    try {
      console.log('Iniciando populateTenantData para tenant:', selectedTenantId);
      
      const options: PopulateOptions = {
        tenantId: selectedTenantId,
        numProdutos: 20,
        numClientes: 20,
        numVendedores: 5,
        numContasPagar: 15,
        numContasReceber: 15,
        numVendas: 50,
        numPedidos: 15,
        numOrdensServico: 10,
        dataInicio: new Date(dataInicioInput.value),
        dataFim: new Date(dataFimInput.value)
      };

      console.log('Options:', options);
      
      await populateTenantData(options);
      
      console.log('Populate concluído com sucesso');
      setResult(`✅ Dados populados com sucesso! 
- 20 produtos
- 20 clientes  
- 5 vendedores
- 15 contas a pagar
- 15 contas a receber
- 50 vendas
- 15 pedidos
- 10 ordens de serviço`);
    } catch (error: any) {
      console.error('Erro completo ao popular dados:', error);
      setResult(`❌ Erro: ${error?.message || 'Erro desconhecido'}. Verifique o console para detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} /> Popular Dados de Teste
          </CardTitle>
          <CardDescription>
            Gera dados fictícios para testes. Todos os dados anteriores serão apagados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cliente (Tenant)</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input 
                id="dataInicio" 
                type="date" 
                defaultValue={format(inicioMes, 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input 
                id="dataFim" 
                type="date" 
                defaultValue={format(hoje, 'yyyy-MM-dd')}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Serão criados:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 20 produtos em 10 categorias</li>
              <li>• 20 clientes</li>
              <li>• 5 vendedores com comissões</li>
              <li>• 15 contas a pagar</li>
              <li>• 15 contas a receber</li>
              <li>• 50 vendas (com vendedores)</li>
              <li>• 15 pedidos (com vendedores)</li>
              <li>• 10 ordens de serviço</li>
            </ul>
          </div>

          {result && (
            <Alert variant={result.includes('✅') ? 'default' : 'destructive'}>
              <AlertDescription className="whitespace-pre-line">{result}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handlePopulate} 
            disabled={loading || !selectedTenantId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Populando dados...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Popular 100 Registros
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== RELATÓRIOS TAB ==========
function RelatoriosTab() {
  const [relatorios, setRelatorios] = useState<VendedorRelatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTenantId) return;

    const dataInicioInput = document.getElementById('relDataInicio') as HTMLInputElement;
    const dataFimInput = document.getElementById('relDataFim') as HTMLInputElement;

    if (!dataInicioInput?.value || !dataFimInput?.value) return;

    setLoading(true);
    try {
      const data = await getRelatorioVendedores(
        selectedTenantId,
        new Date(dataInicioInput.value),
        new Date(dataFimInput.value)
      );
      setRelatorios(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const totalVendas = relatorios.reduce((acc, r) => acc + r.totalVendas, 0);
  const totalValor = relatorios.reduce((acc, r) => acc + r.valorTotal, 0);
  const totalComissao = relatorios.reduce((acc, r) => acc + r.valorComissao, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Vendas por Vendedor</CardTitle>
          <CardDescription>Análise de performance dos vendedores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cliente</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="relDataInicio">Data Início</Label>
              <Input id="relDataInicio" type="date" defaultValue={format(inicioMes, 'yyyy-MM-dd')} />
            </div>
            <div>
              <Label htmlFor="relDataFim">Data Fim</Label>
              <Input id="relDataFim" type="date" defaultValue={format(hoje, 'yyyy-MM-dd')} />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !selectedTenantId}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>

      {relatorios.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Total de Vendas</p>
                <p className="text-3xl font-bold text-blue-700">{totalVendas}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-purple-600">Total Comissões</p>
                <p className="text-2xl font-bold text-purple-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComissao)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-center">Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.map((r) => (
                  <TableRow key={r.vendedorId}>
                    <TableCell className="font-medium">{r.vendedorNome}</TableCell>
                    <TableCell className="text-center">{r.totalVendas}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorTotal)}
                    </TableCell>
                    <TableCell className="text-right text-purple-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorComissao)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.metasAtingidas > 0 ? 'default' : 'secondary'}>
                        {r.metasAtingidas > 0 ? 'Atingida' : 'Não atingida'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
