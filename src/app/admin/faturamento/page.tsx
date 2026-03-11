'use client';

import React, { useState, useRef, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Save,
  Trash2,
  Package,
  PackagePlus,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Status de retorno da SEFAZ
const statusSEFAZ: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  'autorizada': { label: 'Autorizada', color: 'bg-green-500', icon: CheckCircle, description: 'NF-e autorizada pela SEFAZ' },
  'cancelada': { label: 'Cancelada', color: 'bg-gray-500', icon: Ban, description: 'NF-e cancelada' },
  'rejeitada': { label: 'Rejeitada', color: 'bg-red-500', icon: XCircle, description: 'NF-e rejeitada pela SEFAZ' },
  'pendente': { label: 'Pendente', color: 'bg-yellow-500', icon: Clock, description: 'Aguardando processamento' },
  'denegada': { label: 'Denegada', color: 'bg-red-700', icon: ShieldAlert, description: 'Uso denegado' },
  'inutilizada': { label: 'Inutilizada', color: 'bg-gray-400', icon: FileWarning, description: 'Número inutilizado' },
  'contingencia': { label: 'Contingência', color: 'bg-orange-500', icon: AlertCircle, description: 'Emitida em contingência' },
};

interface DadosImportacao {
  emitente: { nome: string; cnpj: string; ie?: string; endereco?: { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string; }; };
  destinatario: { nome: string; cnpj: string; ie?: string; endereco?: { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string; }; };
  produtos: Array<ProdutoNotaFiscal & { categoriaId?: string; darEntrada?: boolean }>;
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
    deleteNotaFiscal,
    addNotaFiscal,
    fornecedores,
    addFornecedor,
    clientes,
    addCliente,
    produtos,
    addProduto,
    updateProduto,
    movimentarEstoque,
  } = useAppStore();
  
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermSaida, setSearchTermSaida] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedNf, setSelectedNf] = useState<NotaFiscal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImportacaoOpen, setDialogImportacaoOpen] = useState(false);
  const [dialogEstoqueOpen, setDialogEstoqueOpen] = useState(false);
  const [savingImportacao, setSavingImportacao] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [dadosImportacao, setDadosImportacao] = useState<DadosImportacao | null>(null);
  const [novoFornecedor, setNovoFornecedor] = useState<Partial<Fornecedor>>({});
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({});
  const [fornecedorExiste, setFornecedorExiste] = useState(true);
  const [clienteExiste, setClienteExiste] = useState(true);
  const [produtosEntrada, setProdutosEntrada] = useState<Record<number, boolean>>({});
  const [precosVenda, setPrecosVenda] = useState<Record<number, number>>({});
  const [criarProduto, setCriarProduto] = useState<Record<number, boolean>>({});

  const notasEntrada = useMemo(() => notasFiscais.filter(n => n.tipo === 'entrada'), [notasFiscais]);
  const notasSaida = useMemo(() => notasFiscais.filter(n => n.tipo === 'saida'), [notasFiscais]);
  
  const filteredNotasEntrada = useMemo(() => {
    return notasEntrada.filter(nota => {
      const matchSearch = nota.numero.includes(searchTerm) ||
        nota.emitente.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || nota.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [notasEntrada, searchTerm, statusFilter]);

  const filteredNotasSaida = useMemo(() => {
    return notasSaida.filter(nota => {
      return nota.numero.includes(searchTermSaida) ||
        nota.destinatario.nome.toLowerCase().includes(searchTermSaida.toLowerCase());
    });
  }, [notasSaida, searchTermSaida]);

  const totalEntradas = notasEntrada.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalSaidas = notasSaida.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);

  const contagemStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    notasFiscais.forEach(nf => { contagem[nf.status] = (contagem[nf.status] || 0) + 1; });
    return contagem;
  }, [notasFiscais]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xml')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Selecione um arquivo XML.' });
      return;
    }

    setImporting(true);
    try {
      const content = await file.text();
      const dados = await parseXMLToDadosImportacao(content);
      
      if (dados) {
        setDadosImportacao(dados);
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
        
        // Inicializar todos os produtos para dar entrada por padrão
        const entradaInicial: Record<number, boolean> = {};
        dados.produtos.forEach((_, idx) => { entradaInicial[idx] = true; });
        setProdutosEntrada(entradaInicial);
        
        setDialogImportacaoOpen(true);
      }
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      toast({ variant: 'destructive', title: 'Erro na importação', description: 'Não foi possível importar o arquivo XML.' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

      const produtosExtraidos: Array<ProdutoNotaFiscal & { categoriaId?: string; darEntrada?: boolean }> = [];
      for (let i = 0; i < detList.length; i++) {
        const det = detList[i];
        const prod = det.getElementsByTagName('prod')[0];
        const imposto = det.getElementsByTagName('imposto')[0];
        
        produtosExtraidos.push({
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
        });
      }

      return {
        emitente: { nome: emit?.getElementsByTagName('xNome')[0]?.textContent || '', cnpj: emit?.getElementsByTagName('CNPJ')[0]?.textContent || emit?.getElementsByTagName('CPF')[0]?.textContent || '', ie: emit?.getElementsByTagName('IE')[0]?.textContent || '', endereco: enderecoEmitente },
        destinatario: { nome: dest?.getElementsByTagName('xNome')[0]?.textContent || '', cnpj: dest?.getElementsByTagName('CNPJ')[0]?.textContent || dest?.getElementsByTagName('CPF')[0]?.textContent || '', ie: dest?.getElementsByTagName('IE')[0]?.textContent || '', endereco: enderecoDestinatario },
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

  const handleConfirmarImportacao = async () => {
    if (!dadosImportacao) return;
    setSavingImportacao(true);
    try {
      if (!fornecedorExiste && novoFornecedor.nome) {
        await addFornecedor({ ...novoFornecedor as Fornecedor, id: `forn-${Date.now()}`, tenantId: tenant?.id || '' });
        toast({ title: 'Fornecedor cadastrado!', description: novoFornecedor.nome });
      }
      
      if (!clienteExiste && novoCliente.nome) {
        await addCliente({ ...novoCliente as Cliente, id: `cli-${Date.now()}`, tenantId: tenant?.id || '' });
        toast({ title: 'Cliente cadastrado!', description: novoCliente.nome });
      }
      
      const nota: NotaFiscal = {
        id: `nf-${Date.now()}`,
        tenantId: tenant?.id || '',
        numero: dadosImportacao.numero,
        serie: dadosImportacao.serie,
        chave: dadosImportacao.chave,
        tipo: 'entrada',
        modelo: 'NF-e',
        emitente: { nome: dadosImportacao.emitente.nome, cnpj: dadosImportacao.emitente.cnpj, ie: dadosImportacao.emitente.ie, endereco: dadosImportacao.emitente.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' } },
        destinatario: { nome: dadosImportacao.destinatario.nome, cnpj: dadosImportacao.destinatario.cnpj, ie: dadosImportacao.destinatario.ie, endereco: dadosImportacao.destinatario.endereco || { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' } },
        valorTotal: dadosImportacao.valorTotal,
        valorProdutos: dadosImportacao.valorProdutos,
        valorICMS: 0, valorPIS: 0, valorCOFINS: 0,
        dataEmissao: dadosImportacao.dataEmissao,
        xmlUrl: '', xmlConteudo: dadosImportacao.xmlConteudo,
        status: 'autorizada',
        produtos: dadosImportacao.produtos
      };
      
      await addNotaFiscal(nota);
      toast({ title: 'XML importado!', description: `Nota fiscal ${nota.numero} foi importada.` });
      
      // Fechar dialog de importação e abrir dialog de entrada no estoque
      setDialogImportacaoOpen(false);
      
      // Sempre mostrar o diálogo de entrada no estoque após importação
      if (dadosImportacao.produtos.length > 0) {
        setDialogEstoqueOpen(true);
      }
      
    } catch (error) {
      console.error('Erro ao confirmar importação:', error);
      toast({ variant: 'destructive', title: 'Erro ao importar', description: 'Não foi possível salvar os dados.' });
    } finally {
      setSavingImportacao(false);
    }
  };

  const handleDarEntradaEstoque = async () => {
    if (!dadosImportacao || !tenant) return;
    
    let entradaCount = 0;
    let produtosCriados = 0;
    let produtosAtualizados = 0;

    for (let idx = 0; idx < dadosImportacao.produtos.length; idx++) {
      const prod = dadosImportacao.produtos[idx];
      if (!produtosEntrada[idx]) continue;

      const produtoExistente = produtos.find(p => p.codigo === prod.codigo);
      const precoVenda = precosVenda[idx];

      if (produtoExistente) {
        // Produto existe - dar entrada no estoque
        movimentarEstoque(produtoExistente.id, 'entrada', prod.quantidade, `NFE ${dadosImportacao.numero}`);
        entradaCount++;

        // Se informou preço de venda, atualizar o produto
        if (precoVenda && precoVenda > 0) {
          await updateProduto(produtoExistente.id, {
            precoVenda: precoVenda,
            precoCusto: prod.valorUnitario, // Atualiza também o preço de custo
          });
          produtosAtualizados++;
        }
      } else if (criarProduto[idx] && precoVenda && precoVenda > 0) {
        // Produto não existe e usuário quer criar - criar novo produto
        const novoProduto = {
          id: `prod-${Date.now()}-${idx}`,
          tenantId: tenant.id,
          codigo: prod.codigo,
          codigoBarras: prod.codigoBarras || '',
          nome: prod.nome,
          descricao: prod.nome,
          tipo: 'produto' as const,
          categoriaId: '', // Categoria padrão vazia
          ncm: prod.ncm || '',
          cst: prod.cst || '',
          cfop: prod.cfop || '',
          unidade: prod.unidade || 'UN',
          precoCusto: prod.valorUnitario,
          precoVenda: precoVenda,
          estoqueAtual: prod.quantidade,
          estoqueMinimo: 0,
          ativo: true,
        };

        await addProduto(novoProduto);
        produtosCriados++;
        entradaCount++;
      } else {
        toast({ 
          title: `Produto ${prod.codigo} não cadastrado`, 
          description: 'Marque a opção "Criar produto" e informe o preço de venda.',
          variant: 'destructive'
        });
      }
    }
    
    if (entradaCount > 0) {
      let mensagem = `${entradaCount} produto(s) deram entrada no estoque.`;
      if (produtosCriados > 0) mensagem += ` ${produtosCriados} produto(s) criado(s).`;
      if (produtosAtualizados > 0) mensagem += ` ${produtosAtualizados} preço(s) atualizado(s).`;
      toast({ title: 'Entrada no estoque', description: mensagem });
    }
    setDialogEstoqueOpen(false);
    setDadosImportacao(null);
    setProdutosEntrada({});
    setPrecosVenda({});
    setCriarProduto({});
  };

  const handlePularEntrada = () => {
    setDialogEstoqueOpen(false);
    setDadosImportacao(null);
    setProdutosEntrada({});
    setPrecosVenda({});
    setCriarProduto({});
    toast({ title: 'Importação concluída', description: 'Você pode dar entrada no estoque posteriormente.' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      try {
        await deleteNotaFiscal(id);
        toast({ title: 'Nota excluída!', description: 'A nota fiscal foi removida.' });
      } catch (error) {
        console.error('Erro ao excluir nota:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir.' });
      }
    }
  };

  const copiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
    toast({ title: 'Chave copiada!' });
  };

  const getStatusBadge = (status: NotaFiscal['status']) => {
    const config = statusSEFAZ[status];
    if (!config) return <Badge variant="secondary">{status}</Badge>;
    const Icon = config.icon;
    return <Badge className={`${config.color} text-white text-[10px] px-1.5 py-0.5`}><Icon className="h-3 w-3 mr-0.5" />{config.label}</Badge>;
  };

  return (
    <MainLayout breadcrumbs={[{ title: 'Nota Fiscal' }]}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Nota Fiscal</h1>
            <p className="text-sm text-muted-foreground">Gerencie notas fiscais de entrada e saída</p>
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar XML
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total NF-e</p>
                  <p className="text-xl font-bold">{notasFiscais.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Autorizadas</p>
                  <p className="text-xl font-bold">{contagemStatus['autorizada'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Download className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="text-xl font-bold">R$ {(totalEntradas/1000).toFixed(1)}k</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saídas</p>
                  <p className="text-xl font-bold">R$ {(totalSaidas/1000).toFixed(1)}k</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="entrada" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entrada" className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Entrada ({notasEntrada.length})
            </TabsTrigger>
            <TabsTrigger value="saida" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Saída ({notasSaida.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Entrada */}
          <TabsContent value="entrada">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por número ou emitente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Emitente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotasEntrada.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma nota de entrada encontrada
                          </TableCell>
                        </TableRow>
                      ) : filteredNotasEntrada.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-mono">{nota.numero}/{nota.serie}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{nota.emitente.nome}</p>
                              <p className="text-xs text-muted-foreground">{nota.emitente.cnpj}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedNf(nota); setDialogOpen(true); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => copiarChave(nota.chave)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(nota.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Saída */}
          <TabsContent value="saida">
            <Card>
              <CardHeader className="pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por número ou destinatário..." value={searchTermSaida} onChange={(e) => setSearchTermSaida(e.target.value)} className="pl-10" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotasSaida.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma nota de saída</p>
                            <p className="text-sm">As notas de saída são geradas automaticamente nas vendas</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredNotasSaida.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-mono">{nota.numero}/{nota.serie}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{nota.destinatario.nome}</p>
                              {nota.destinatario.cnpj && <p className="text-xs text-muted-foreground">{nota.destinatario.cnpj}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedNf(nota); setDialogOpen(true); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => copiarChave(nota.chave)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e</DialogTitle>
          </DialogHeader>
          {selectedNf && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center gap-2">{getStatusBadge(selectedNf.status)}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Número:</span> <span className="font-mono font-bold">{selectedNf.numero}/{selectedNf.serie}</span></div>
                  <div><span className="text-muted-foreground">Modelo:</span> {selectedNf.modelo}</div>
                </div>
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <p className="text-muted-foreground text-xs">Emitente</p>
                  <p className="font-medium">{selectedNf.emitente.nome}</p>
                  <p className="text-muted-foreground text-xs">{selectedNf.emitente.cnpj}</p>
                </div>
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <p className="text-muted-foreground text-xs">Destinatário</p>
                  <p className="font-medium">{selectedNf.destinatario.nome}</p>
                  {selectedNf.destinatario.cnpj && <p className="text-muted-foreground text-xs">{selectedNf.destinatario.cnpj}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Produtos:</span> R$ {selectedNf.valorProdutos.toFixed(2)}</div>
                  <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">R$ {selectedNf.valorTotal.toFixed(2)}</span></div>
                </div>
                {selectedNf.produtos && selectedNf.produtos.length > 0 && (
                  <div className="border rounded max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="text-xs">Cód.</TableHead>
                          <TableHead className="text-xs">Descrição</TableHead>
                          <TableHead className="text-xs text-right">Qtd</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedNf.produtos.map((prod, idx) => (
                          <TableRow key={idx} className="h-8">
                            <TableCell className="text-xs font-mono">{prod.codigo}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">{prod.nome}</TableCell>
                            <TableCell className="text-xs text-right">{prod.quantidade}</TableCell>
                            <TableCell className="text-xs text-right">R$ {prod.valorTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Importação */}
      <Dialog open={dialogImportacaoOpen} onOpenChange={setDialogImportacaoOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Confirmar Importação</DialogTitle>
            <DialogDescription>Revise os dados da nota fiscal antes de confirmar</DialogDescription>
          </DialogHeader>
          {dadosImportacao && (
            <ScrollArea className="max-h-[55vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded text-sm">
                  <div><span className="text-muted-foreground">Número:</span> <span className="font-bold">{dadosImportacao.numero}/{dadosImportacao.serie}</span></div>
                  <div><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-green-600">R$ {dadosImportacao.valorTotal.toFixed(2)}</span></div>
                  <div><span className="text-muted-foreground">Data:</span> {dadosImportacao.dataEmissao.toLocaleDateString('pt-BR')}</div>
                </div>
                <div className={`p-3 rounded border ${fornecedorExiste ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dadosImportacao.emitente.nome}</p>
                      <p className="text-xs text-muted-foreground">{dadosImportacao.emitente.cnpj}</p>
                    </div>
                    {fornecedorExiste ? (
                      <Badge className="bg-green-500">Cadastrado</Badge>
                    ) : (
                      <Badge className="bg-orange-500">Novo - será cadastrado</Badge>
                    )}
                  </div>
                </div>
                {dadosImportacao.produtos.length > 0 && (
                  <div className="border rounded">
                    <div className="p-2 bg-muted/50 font-medium text-sm">Produtos ({dadosImportacao.produtos.length})</div>
                    <div className="max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="text-xs">Cód.</TableHead>
                            <TableHead className="text-xs">Produto</TableHead>
                            <TableHead className="text-xs text-right">Qtd</TableHead>
                            <TableHead className="text-xs text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosImportacao.produtos.map((prod, idx) => (
                            <TableRow key={idx} className="h-8">
                              <TableCell className="text-xs font-mono">{prod.codigo}</TableCell>
                              <TableCell className="text-xs">{prod.nome}</TableCell>
                              <TableCell className="text-xs text-right">{prod.quantidade}</TableCell>
                              <TableCell className="text-xs text-right">R$ {prod.valorTotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogImportacaoOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarImportacao} disabled={savingImportacao}>
              {savingImportacao ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Entrada Estoque */}
      <Dialog open={dialogEstoqueOpen} onOpenChange={setDialogEstoqueOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" />Entrada no Estoque</DialogTitle>
            <DialogDescription>Selecione quais itens deseja dar entrada no estoque e informe o preço de venda.</DialogDescription>
          </DialogHeader>
          {dadosImportacao && (
            <ScrollArea className="max-h-[55vh]">
              <div className="pr-4">
                <div className="p-2 bg-blue-50 rounded text-sm mb-4">
                  <span className="font-medium">Nota Fiscal:</span> {dadosImportacao.numero} - {dadosImportacao.emitente.nome}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-20 text-right">Qtd</TableHead>
                      <TableHead className="w-28 text-right">Custo Unit.</TableHead>
                      <TableHead className="w-28 text-right">Preço Venda</TableHead>
                      <TableHead className="w-20 text-right">Margem</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosImportacao.produtos.map((prod, idx) => {
                      const produtoExistente = produtos.find(p => p.codigo === prod.codigo);
                      return (
                        <TableRow key={idx} className={produtosEntrada[idx] ? 'bg-blue-50/50' : ''}>
                          <TableCell>
                            <Checkbox 
                              id={`prod-${idx}`}
                              checked={produtosEntrada[idx] || false} 
                              onCheckedChange={(checked) => setProdutosEntrada(prev => ({ ...prev, [idx]: !!checked }))} 
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{prod.codigo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{prod.nome}</p>
                              {!produtoExistente && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Checkbox 
                                    id={`criar-${idx}`}
                                    checked={criarProduto[idx] || false} 
                                    onCheckedChange={(checked) => setCriarProduto(prev => ({ ...prev, [idx]: !!checked }))} 
                                  />
                                  <Label htmlFor={`criar-${idx}`} className="text-xs text-orange-600 cursor-pointer">
                                    Criar produto
                                  </Label>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{prod.quantidade} {prod.unidade}</TableCell>
                          <TableCell className="text-right text-sm">R$ {prod.valorUnitario.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="pl-7 h-8 text-sm text-right w-24"
                                value={precosVenda[idx] || ''}
                                onChange={(e) => setPrecosVenda(prev => ({ 
                                  ...prev, 
                                  [idx]: parseFloat(e.target.value) || 0 
                                }))}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {precosVenda[idx] && precosVenda[idx] > 0 && prod.valorUnitario > 0 ? (
                              <span className={((precosVenda[idx] - prod.valorUnitario) / prod.valorUnitario) * 100 >= 30 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                                {(((precosVenda[idx] - prod.valorUnitario) / prod.valorUnitario) * 100).toFixed(0)}%
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {produtoExistente ? (
                              <Badge className="bg-green-500 text-xs">
                                Est: {produtoExistente.estoqueAtual}
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-500 text-xs">Novo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handlePularEntrada}>Pular</Button>
            <Button onClick={handleDarEntradaEstoque}>
              <Package className="mr-2 h-4 w-4" />Dar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
