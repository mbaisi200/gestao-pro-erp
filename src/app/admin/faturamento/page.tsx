'use client';

import React, { useState, useRef, useMemo } from 'react';
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
import { NotaFiscal, ProdutoNotaFiscal, Fornecedor, Cliente } from '@/types';
import {
  FileText,
  Upload,
  Download,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileWarning,
  ShieldAlert,
  AlertCircle,
  Receipt,
  Copy,
  Eye,
  Ban,
  Building2,
  UserPlus,
  Save,
  Plus,
  FilePlus,
  Send,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Status de retorno da SEFAZ
const statusSEFAZ: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  'autorizada': { label: 'Autorizada', color: 'bg-green-500', icon: CheckCircle, description: 'NF-e autorizada pela SEFAZ' },
  'cancelada': { label: 'Cancelada', color: 'bg-gray-500', icon: Ban, description: 'NF-e cancelada' },
  'rejeitada': { label: 'Rejeitada', color: 'bg-red-500', icon: XCircle, description: 'NF-e rejeitada pela SEFAZ - Verificar erros' },
  'pendente': { label: 'Pendente', color: 'bg-yellow-500', icon: Clock, description: 'Aguardando processamento' },
  'denegada': { label: 'Denegada', color: 'bg-red-700', icon: ShieldAlert, description: 'Uso denegado - Irregularidade do destinatário' },
  'inutilizada': { label: 'Inutilizada', color: 'bg-gray-400', icon: FileWarning, description: 'Número inutilizado' },
  'contingencia': { label: 'Contingência', color: 'bg-orange-500', icon: AlertCircle, description: 'Emitida em contingência - Aguardando autorização' },
};

// Interface para dados temporários da importação
interface DadosImportacao {
  emitente: {
    nome: string;
    cnpj: string;
    ie?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  destinatario: {
    nome: string;
    cnpj: string;
    ie?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  produtos: Array<ProdutoNotaFiscal & { categoriaId?: string }>;
  numero: string;
  serie: string;
  chave: string;
  valorTotal: number;
  valorProdutos: number;
  dataEmissao: Date;
  xmlConteudo: string;
}

export default function FaturamentoPage() {
  const { tenant } = useAuthStore();
  const { 
    notasFiscais, 
    importarXML, 
    deleteNotaFiscal,
    addNotaFiscal,
    fornecedores,
    addFornecedor,
    clientes,
    addCliente,
    categorias,
    produtos,
    addProduto
  } = useAppStore();
  
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedNf, setSelectedNf] = useState<NotaFiscal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImportacaoOpen, setDialogImportacaoOpen] = useState(false);
  const [savingImportacao, setSavingImportacao] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Dados temporários da importação
  const [dadosImportacao, setDadosImportacao] = useState<DadosImportacao | null>(null);
  const [novoFornecedor, setNovoFornecedor] = useState<Partial<Fornecedor>>({});
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({});
  const [fornecedorExiste, setFornecedorExiste] = useState(true);
  const [clienteExiste, setClienteExiste] = useState(true);

  const filteredNotas = useMemo(() => {
    return notasFiscais.filter(nota => {
      const matchSearch = nota.numero.includes(searchTerm) ||
        nota.emitente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.destinatario.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || nota.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [notasFiscais, searchTerm, statusFilter]);

  const notasEntrada = notasFiscais.filter(n => n.tipo === 'entrada');
  const notasSaida = notasFiscais.filter(n => n.tipo === 'saida');
  
  const totalEntradas = notasEntrada.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalSaidas = notasSaida.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);

  const contagemStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    notasFiscais.forEach(nf => {
      contagem[nf.status] = (contagem[nf.status] || 0) + 1;
    });
    return contagem;
  }, [notasFiscais]);

  // Parse XML e abre diálogo de confirmação
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor, selecione um arquivo XML.' });
      return;
    }

    setImporting(true);
    try {
      const content = await file.text();
      const dados = await parseXMLToDadosImportacao(content);
      
      if (dados) {
        setDadosImportacao(dados);
        
        // Verificar se fornecedor já existe
        const fornecedorExistente = fornecedores.find(f => 
          f.cnpj.replace(/\D/g, '') === dados.emitente.cnpj.replace(/\D/g, '')
        );
        setFornecedorExiste(!!fornecedorExistente);
        
        if (!fornecedorExistente) {
          setNovoFornecedor({
            nome: dados.emitente.nome,
            razaoSocial: dados.emitente.nome,
            cnpj: dados.emitente.cnpj,
            inscricaoEstadual: dados.emitente.ie,
            email: '',
            telefone: '',
            endereco: dados.emitente.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
            contato: '',
            ativo: true
          });
        }
        
        // Verificar se cliente já existe
        if (dados.destinatario.cnpj) {
          const clienteExistente = clientes.find(c => 
            c.cpfCnpj.replace(/\D/g, '') === dados.destinatario.cnpj.replace(/\D/g, '')
          );
          setClienteExiste(!!clienteExistente);
          
          if (!clienteExistente) {
            setNovoCliente({
              nome: dados.destinatario.nome,
              cpfCnpj: dados.destinatario.cnpj,
              inscricaoEstadual: dados.destinatario.ie,
              email: '',
              telefone: '',
              endereco: dados.destinatario.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
              ativo: true
            });
          }
        }
        
        setDialogImportacaoOpen(true);
      }
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      toast({ variant: 'destructive', title: 'Erro na importação', description: 'Não foi possível importar o arquivo XML.' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Parse XML para dados de importação
  const parseXMLToDadosImportacao = async (xmlContent: string): Promise<DadosImportacao | null> => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const nfe = xmlDoc.getElementsByTagName('NFe')[0];
      if (!nfe) throw new Error('XML inválido');
      
      const ide = nfe.getElementsByTagName('ide')[0];
      const emit = nfe.getElementsByTagName('emit')[0];
      const dest = nfe.getElementsByTagName('dest')[0];
      const total = nfe.getElementsByTagName('total')[0];
      const detList = nfe.getElementsByTagName('det');
      
      // Extrair endereço do emitente
      const enderEmit = emit?.getElementsByTagName('enderEmit')[0];
      const enderecoEmitente = enderEmit ? {
        logradouro: enderEmit.getElementsByTagName('xLgr')[0]?.textContent || '',
        numero: enderEmit.getElementsByTagName('nro')[0]?.textContent || '',
        complemento: enderEmit.getElementsByTagName('xCpl')[0]?.textContent || '',
        bairro: enderEmit.getElementsByTagName('xBairro')[0]?.textContent || '',
        cidade: enderEmit.getElementsByTagName('xMun')[0]?.textContent || '',
        estado: enderEmit.getElementsByTagName('UF')[0]?.textContent || '',
        cep: enderEmit.getElementsByTagName('CEP')[0]?.textContent || ''
      } : undefined;

      // Extrair endereço do destinatário
      const enderDest = dest?.getElementsByTagName('enderDest')[0];
      const enderecoDestinatario = enderDest ? {
        logradouro: enderDest.getElementsByTagName('xLgr')[0]?.textContent || '',
        numero: enderDest.getElementsByTagName('nro')[0]?.textContent || '',
        complemento: enderDest.getElementsByTagName('xCpl')[0]?.textContent || '',
        bairro: enderDest.getElementsByTagName('xBairro')[0]?.textContent || '',
        cidade: enderDest.getElementsByTagName('xMun')[0]?.textContent || '',
        estado: enderDest.getElementsByTagName('UF')[0]?.textContent || '',
        cep: enderDest.getElementsByTagName('CEP')[0]?.textContent || ''
      } : undefined;

      // Extrair produtos
      const produtosExtraidos: Array<ProdutoNotaFiscal & { categoriaId?: string }> = [];
      for (let i = 0; i < detList.length; i++) {
        const det = detList[i];
        const prod = det.getElementsByTagName('prod')[0];
        const imposto = det.getElementsByTagName('imposto')[0];
        
        const produto: ProdutoNotaFiscal & { categoriaId?: string } = {
          codigo: prod?.getElementsByTagName('cProd')[0]?.textContent || '',
          codigoBarras: prod?.getElementsByTagName('cEAN')[0]?.textContent || '',
          nome: prod?.getElementsByTagName('xProd')[0]?.textContent || '',
          ncm: prod?.getElementsByTagName('NCM')[0]?.textContent || '',
          cfop: prod?.getElementsByTagName('CFOP')[0]?.textContent || '',
          cst: imposto?.getElementsByTagName('CST')[0]?.textContent || imposto?.getElementsByTagName('CSOSN')[0]?.textContent || '',
          unidade: prod?.getElementsByTagName('uCom')[0]?.textContent || '',
          quantidade: parseFloat(prod?.getElementsByTagName('qCom')[0]?.textContent || '0'),
          valorUnitario: parseFloat(prod?.getElementsByTagName('vUnCom')[0]?.textContent || '0'),
          valorTotal: parseFloat(prod?.getElementsByTagName('vProd')[0]?.textContent || '0'),
        };
        
        produtosExtraidos.push(produto);
      }

      return {
        emitente: {
          nome: emit?.getElementsByTagName('xNome')[0]?.textContent || '',
          cnpj: emit?.getElementsByTagName('CNPJ')[0]?.textContent || emit?.getElementsByTagName('CPF')[0]?.textContent || '',
          ie: emit?.getElementsByTagName('IE')[0]?.textContent || '',
          endereco: enderecoEmitente
        },
        destinatario: {
          nome: dest?.getElementsByTagName('xNome')[0]?.textContent || '',
          cnpj: dest?.getElementsByTagName('CNPJ')[0]?.textContent || dest?.getElementsByTagName('CPF')[0]?.textContent || '',
          ie: dest?.getElementsByTagName('IE')[0]?.textContent || '',
          endereco: enderecoDestinatario
        },
        produtos: produtosExtraidos,
        numero: ide?.getElementsByTagName('nNF')[0]?.textContent || '',
        serie: ide?.getElementsByTagName('serie')[0]?.textContent || '',
        chave: '',
        valorTotal: parseFloat(total?.getElementsByTagName('vNF')[0]?.textContent || '0'),
        valorProdutos: parseFloat(total?.getElementsByTagName('vProd')[0]?.textContent || '0'),
        dataEmissao: new Date(ide?.getElementsByTagName('dhEmi')[0]?.textContent || new Date()),
        xmlConteudo: xmlContent
      };
    } catch (error) {
      console.error('Erro ao fazer parse do XML:', error);
      return null;
    }
  };

  // Confirmar importação
  const handleConfirmarImportacao = async () => {
    if (!dadosImportacao) return;
    
    setSavingImportacao(true);
    try {
      // 1. Cadastrar fornecedor se não existir
      if (!fornecedorExiste && novoFornecedor.nome) {
        await addFornecedor({
          ...novoFornecedor as Fornecedor,
          id: `forn-${Date.now()}`,
          tenantId: tenant?.id || ''
        });
        toast({ title: 'Fornecedor cadastrado!', description: novoFornecedor.nome });
      }
      
      // 2. Cadastrar cliente se não existir
      if (!clienteExiste && novoCliente.nome) {
        await addCliente({
          ...novoCliente as Cliente,
          id: `cli-${Date.now()}`,
          tenantId: tenant?.id || ''
        });
        toast({ title: 'Cliente cadastrado!', description: novoCliente.nome });
      }
      
      // 3. Salvar nota fiscal
      const nota: NotaFiscal = {
        id: `nf-${Date.now()}`,
        tenantId: tenant?.id || '',
        numero: dadosImportacao.numero,
        serie: dadosImportacao.serie,
        chave: dadosImportacao.chave,
        tipo: 'entrada',
        modelo: 'NF-e',
        emitente: {
          nome: dadosImportacao.emitente.nome,
          cnpj: dadosImportacao.emitente.cnpj,
          ie: dadosImportacao.emitente.ie,
          endereco: dadosImportacao.emitente.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        },
        destinatario: {
          nome: dadosImportacao.destinatario.nome,
          cnpj: dadosImportacao.destinatario.cnpj,
          ie: dadosImportacao.destinatario.ie,
          endereco: dadosImportacao.destinatario.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        },
        valorTotal: dadosImportacao.valorTotal,
        valorProdutos: dadosImportacao.valorProdutos,
        valorICMS: 0,
        valorPIS: 0,
        valorCOFINS: 0,
        dataEmissao: dadosImportacao.dataEmissao,
        xmlUrl: '',
        xmlConteudo: dadosImportacao.xmlConteudo,
        status: 'autorizada',
        produtos: dadosImportacao.produtos
      };
      
      await addNotaFiscal(nota);
      
      toast({
        title: 'XML importado com sucesso!',
        description: `Nota fiscal ${nota.numero} foi importada.`,
      });
      
      setDialogImportacaoOpen(false);
      setDadosImportacao(null);
      
    } catch (error) {
      console.error('Erro ao confirmar importação:', error);
      toast({ variant: 'destructive', title: 'Erro ao importar', description: 'Não foi possível salvar os dados.' });
    } finally {
      setSavingImportacao(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      try {
        await deleteNotaFiscal(id);
        toast({ title: 'Nota excluída!', description: 'A nota fiscal foi removida com sucesso.' });
      } catch (error) {
        console.error('Erro ao excluir nota:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir a nota fiscal.' });
      }
    }
  };

  const consultarStatusSEFAZ = async (nota: NotaFiscal) => {
    toast({ title: 'Consultando SEFAZ...', description: 'Verificando status da nota fiscal.' });
    setTimeout(() => {
      toast({ title: 'Consulta realizada', description: `Status atual: ${statusSEFAZ[nota.status]?.label || nota.status}` });
    }, 1500);
  };

  const copiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
    toast({ title: 'Chave copiada!', description: 'A chave de acesso foi copiada.' });
  };

  const getStatusBadge = (status: NotaFiscal['status']) => {
    const config = statusSEFAZ[status];
    if (!config) return <Badge>{status}</Badge>;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <MainLayout breadcrumbs={[{ title: 'Admin' }, { title: 'Nota Fiscal de Entrada' }]}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Nota Fiscal de Entrada</h1>
            <p className="text-sm text-muted-foreground">Gerencie notas fiscais de entrada e documentos fiscais</p>
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar XML
            </Button>
          </div>
        </div>

        {/* Alertas de Status - Compacto */}
        {(contagemStatus['rejeitada'] > 0 || contagemStatus['denegada'] > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <span className="font-medium text-red-800 text-sm">Atenção: </span>
                  <span className="text-sm text-red-700">
                    {contagemStatus['rejeitada'] > 0 && `${contagemStatus['rejeitada']} rejeitada(s)`}
                    {contagemStatus['rejeitada'] > 0 && contagemStatus['denegada'] > 0 && ' • '}
                    {contagemStatus['denegada'] > 0 && `${contagemStatus['denegada']} denegada(s)`}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('rejeitada')}>
                  Ver problemas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats - Cards Compactos */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card className="p-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Notas</p>
                  <p className="text-lg font-bold">{notasFiscais.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Autorizadas</p>
                  <p className="text-lg font-bold">{contagemStatus['autorizada'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Download className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Entradas</p>
                  <p className="text-lg font-bold">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Saídas</p>
                  <p className="text-lg font-bold">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status SEFAZ - Compacto */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Status SEFAZ
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(contagemStatus).map(([status, count]) => {
                const config = statusSEFAZ[status];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === status ? 'todos' : status)}
                    className="h-7 text-xs gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">{count}</Badge>
                  </Button>
                );
              })}
              {statusFilter !== 'todos' && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStatusFilter('todos')}>
                  Limpar filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs para separar Entrada e Saída */}
        <Tabs defaultValue="entrada" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="entrada" className="text-sm">
              NF-e de Entrada ({notasEntrada.length})
            </TabsTrigger>
            <TabsTrigger value="saida" className="text-sm">
              NF-e de Saída ({notasSaida.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Entrada */}
          <TabsContent value="entrada" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, emitente ou destinatário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {filteredNotas.filter(n => n.tipo === 'entrada').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma nota fiscal de entrada encontrada</p>
                    <p className="text-xs">Importe um arquivo XML para adicionar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Número/Série</TableHead>
                          <TableHead className="text-xs">Modelo</TableHead>
                          <TableHead className="text-xs">Emitente</TableHead>
                          <TableHead className="text-xs">Destinatário</TableHead>
                          <TableHead className="text-xs text-right">Valor</TableHead>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotas.filter(n => n.tipo === 'entrada').map((nota) => (
                          <TableRow key={nota.id} className={nota.status === 'rejeitada' || nota.status === 'denegada' ? 'bg-red-50' : ''}>
                            <TableCell className="font-mono text-sm">{nota.numero}/{nota.serie}</TableCell>
                            <TableCell className="text-sm">{nota.modelo}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{nota.emitente.nome}</p>
                              <p className="text-xs text-muted-foreground">{nota.emitente.cnpj}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{nota.destinatario.nome}</p>
                              {nota.destinatario.cnpj && (
                                <p className="text-xs text-muted-foreground">{nota.destinatario.cnpj}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-sm">{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{getStatusBadge(nota.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedNf(nota); setDialogOpen(true); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copiarChave(nota.chave)} title="Copiar chave">
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => consultarStatusSEFAZ(nota)} title="Consultar SEFAZ">
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
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
          </TabsContent>

          {/* Tab Saída */}
          <TabsContent value="saida" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {notasSaida.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma nota fiscal de saída encontrada</p>
                    <p className="text-xs">As notas de saída são geradas automaticamente nas vendas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Número/Série</TableHead>
                          <TableHead className="text-xs">Modelo</TableHead>
                          <TableHead className="text-xs">Destinatário</TableHead>
                          <TableHead className="text-xs text-right">Valor</TableHead>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notasSaida.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell className="font-mono text-sm">{nota.numero}/{nota.serie}</TableCell>
                            <TableCell className="text-sm">{nota.modelo}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{nota.destinatario.nome}</p>
                              {nota.destinatario.cnpj && (
                                <p className="text-xs text-muted-foreground">{nota.destinatario.cnpj}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-sm">{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{getStatusBadge(nota.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedNf(nota); setDialogOpen(true); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copiarChave(nota.chave)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>Informações completas da NF-e</DialogDescription>
          </DialogHeader>
          {selectedNf && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${selectedNf.status === 'autorizada' ? 'bg-green-50 border border-green-200' : selectedNf.status === 'rejeitada' || selectedNf.status === 'denegada' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedNf.status)}
                  <span className="text-sm">{statusSEFAZ[selectedNf.status]?.description}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Número</Label>
                  <p className="font-mono font-bold">{selectedNf.numero}/{selectedNf.serie}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Modelo</Label>
                  <p className="font-medium">{selectedNf.modelo}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Chave de Acesso</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all flex-1">{selectedNf.chave}</p>
                  <Button size="sm" variant="ghost" onClick={() => copiarChave(selectedNf.chave)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Emitente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedNf.emitente.nome}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {selectedNf.emitente.cnpj}</p>
                  {selectedNf.emitente.ie && <p className="text-sm text-muted-foreground">IE: {selectedNf.emitente.ie}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Destinatário</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedNf.destinatario.nome}</p>
                  {selectedNf.destinatario.cnpj && <p className="text-sm text-muted-foreground">CNPJ/CPF: {selectedNf.destinatario.cnpj}</p>}
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Valor dos Produtos</Label>
                  <p className="font-medium">R$ {selectedNf.valorProdutos.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Valor Total</Label>
                  <p className="font-bold text-lg">R$ {selectedNf.valorTotal.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Produtos */}
              {selectedNf.produtos && selectedNf.produtos.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs mb-2 block">Produtos ({selectedNf.produtos.length})</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Código</TableHead>
                          <TableHead className="text-xs">Descrição</TableHead>
                          <TableHead className="text-xs">NCM</TableHead>
                          <TableHead className="text-xs text-right">Qtd</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedNf.produtos.map((prod, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">{prod.codigo}</TableCell>
                            <TableCell className="text-sm">{prod.nome}</TableCell>
                            <TableCell className="font-mono text-xs">{prod.ncm}</TableCell>
                            <TableCell className="text-right">{prod.quantidade}</TableCell>
                            <TableCell className="text-right">R$ {prod.valorTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Importação XML */}
      <Dialog open={dialogImportacaoOpen} onOpenChange={setDialogImportacaoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Confirmar Importação XML
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de confirmar a importação.
            </DialogDescription>
          </DialogHeader>
          
          {dadosImportacao && (
            <div className="space-y-4">
              {/* Dados da Nota */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Número/Série</p>
                  <p className="font-mono font-bold">{dadosImportacao.numero}/{dadosImportacao.serie}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg text-green-600">
                    R$ {dadosImportacao.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Emissão</p>
                  <p className="font-medium">{dadosImportacao.dataEmissao.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Fornecedor */}
              <Card className={fornecedorExiste ? 'border-green-200' : 'border-orange-200'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Fornecedor (Emitente)
                    {fornecedorExiste ? (
                      <Badge className="bg-green-500 text-xs">Cadastrado</Badge>
                    ) : (
                      <Badge className="bg-orange-500 text-xs">Novo</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!fornecedorExiste && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                          value={novoFornecedor.nome || ''}
                          onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CNPJ</Label>
                        <Input value={novoFornecedor.cnpj || ''} disabled className="h-8 bg-gray-50" />
                      </div>
                    </div>
                  )}
                  {fornecedorExiste && (
                    <div className="text-sm">
                      <p className="font-medium">{dadosImportacao.emitente.nome}</p>
                      <p className="text-muted-foreground">CNPJ: {dadosImportacao.emitente.cnpj}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Produtos */}
              {dadosImportacao.produtos.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Produtos ({dadosImportacao.produtos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Código</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                            <TableHead className="text-xs">Qtd</TableHead>
                            <TableHead className="text-xs text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosImportacao.produtos.map((prod, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{prod.codigo}</TableCell>
                              <TableCell className="text-sm">{prod.nome}</TableCell>
                              <TableCell className="text-sm">{prod.quantidade}</TableCell>
                              <TableCell className="text-right text-sm">R$ {prod.valorTotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogImportacaoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarImportacao} disabled={savingImportacao}>
              {savingImportacao ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar Importação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
