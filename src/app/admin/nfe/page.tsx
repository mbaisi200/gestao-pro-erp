'use client';

import React, { useState, useMemo, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { NotaFiscal, ProdutoNotaFiscal, Produto, Fornecedor } from '@/types';
import {
  FileText,
  Search,
  Eye,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Loader2,
  Building2,
  Package,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  Warehouse,
  Plus,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFornecedorByCNPJ, createFornecedor } from '@/lib/firestore-service';

// Interface para o item do preview com opção de estoque
interface ItemPreview extends ProdutoNotaFiscal {
  enviarEstoque: boolean;
  produtoExiste: boolean;
  produtoId?: string;
  categoriaId?: string;
}

// Interface para o preview da NFe
interface PreviewNFe {
  numero: string;
  serie: string;
  dataEmissao: Date;
  emitente: {
    nome: string;
    cnpj: string;
    ie: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  destinatario: {
    nome: string;
    cnpj: string;
    ie: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  valorTotal: number;
  valorProdutos: number;
  itens: ItemPreview[];
  xmlContent: string;
  fornecedorExiste: boolean;
}

export default function NFePage() {
  const { tenant, user } = useAuthStore();
  const { 
    notasFiscais, 
    addNotaFiscal, 
    deleteNotaFiscal,
    produtos, 
    categorias, 
    addProduto,
    updateProduto,
    fornecedores,
    addFornecedor,
    addContaPagar,
    movimentarEstoque,
    currentTenant
  } = useAppStore();
  
  // Usar o tenant do auth-store ou currentTenant do app-store
  const activeTenant = tenant || currentTenant;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<'entrada' | 'saida' | 'todos'>('todos');
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Estados para o preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewNFe | null>(null);
  const [gerarContaPagar, setGerarContaPagar] = useState(false);
  const [dataVencimento, setDataVencimento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);

  const filteredNotas = useMemo(() => {
    return notasFiscais.filter(nota => {
      const matchSearch = nota.numero.includes(searchTerm) ||
        nota.destinatario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.emitente.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || nota.status === statusFilter;
      const matchTipo = tipoFilter === 'todos' || nota.tipo === tipoFilter;
      return matchSearch && matchStatus && matchTipo;
    });
  }, [notasFiscais, searchTerm, statusFilter, tipoFilter]);

  const notasEntrada = notasFiscais.filter(n => n.tipo === 'entrada');
  const notasSaida = notasFiscais.filter(n => n.tipo === 'saida');
  const totalEntrada = notasEntrada.reduce((acc, n) => acc + n.valorTotal, 0);
  const totalSaida = notasSaida.reduce((acc, n) => acc + n.valorTotal, 0);

  const getTipoBadge = (tipo: NotaFiscal['tipo']) => {
    if (tipo === 'entrada') {
      return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><FileText className="h-3 w-3" /> Entrada</Badge>;
    } else {
      return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1"><FileText className="h-3 w-3" /> Saída</Badge>;
    }
  };

  const getStatusBadge = (status: NotaFiscal['status']) => {
    switch (status) {
      case 'autorizada':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Autorizada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'rejeitada':
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'denegada':
        return <Badge className="bg-orange-100 text-orange-800">Denegada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Verificar se produto existe
  const verificarProdutoExiste = (codigo: string, codigoBarras?: string): { existe: boolean; produto?: Produto } => {
    const porCodigo = produtos.find(p => p.codigo === codigo);
    if (porCodigo) return { existe: true, produto: porCodigo };
    
    if (codigoBarras) {
      const porBarras = produtos.find(p => p.codigoBarras === codigoBarras);
      if (porBarras) return { existe: true, produto: porBarras };
    }
    
    return { existe: false };
  };

  // Verificar se fornecedor existe
  const verificarFornecedorExiste = async (cnpj: string): Promise<boolean> => {
    if (!activeTenant?.id) return false;
    try {
      const fornecedor = await getFornecedorByCNPJ(activeTenant.id, cnpj.replace(/\D/g, ''));
      return !!fornecedor;
    } catch {
      return false;
    }
  };

  // Parse do XML
  const parseXML = async (content: string): Promise<PreviewNFe> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML malformado');
    }
    
    const nfe = xmlDoc.getElementsByTagName('NFe')[0];
    if (!nfe) throw new Error('XML inválido - NFe não encontrada');
    
    const ide = nfe.getElementsByTagName('ide')[0];
    const emit = nfe.getElementsByTagName('emit')[0];
    const dest = nfe.getElementsByTagName('dest')[0];
    const total = nfe.getElementsByTagName('total')[0];
    const detList = nfe.getElementsByTagName('det');
    
    if (!ide || !emit || !total) {
      throw new Error('XML inválido - campos obrigatórios não encontrados');
    }
    
    // Extrair endereços
    const enderEmit = emit.getElementsByTagName('enderEmit')[0];
    const enderecoEmitente = enderEmit ? {
      logradouro: enderEmit.getElementsByTagName('xLgr')[0]?.textContent || '',
      numero: enderEmit.getElementsByTagName('nro')[0]?.textContent || '',
      bairro: enderEmit.getElementsByTagName('xBairro')[0]?.textContent || '',
      cidade: enderEmit.getElementsByTagName('xMun')[0]?.textContent || '',
      estado: enderEmit.getElementsByTagName('UF')[0]?.textContent || '',
      cep: enderEmit.getElementsByTagName('CEP')[0]?.textContent || ''
    } : { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' };
    
    const enderDest = dest?.getElementsByTagName('enderDest')[0];
    const enderecoDestinatario = enderDest ? {
      logradouro: enderDest.getElementsByTagName('xLgr')[0]?.textContent || '',
      numero: enderDest.getElementsByTagName('nro')[0]?.textContent || '',
      bairro: enderDest.getElementsByTagName('xBairro')[0]?.textContent || '',
      cidade: enderDest.getElementsByTagName('xMun')[0]?.textContent || '',
      estado: enderDest.getElementsByTagName('UF')[0]?.textContent || '',
      cep: enderDest.getElementsByTagName('CEP')[0]?.textContent || ''
    } : { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' };

    // Extrair produtos com verificação de existência
    const itensPreview: ItemPreview[] = [];
    for (let i = 0; i < detList.length; i++) {
      const det = detList[i];
      const prod = det.getElementsByTagName('prod')[0];
      const imposto = det.getElementsByTagName('imposto')[0];
      
      if (prod) {
        const codigo = prod.getElementsByTagName('cProd')[0]?.textContent || '';
        const codigoBarras = prod.getElementsByTagName('cEAN')[0]?.textContent || '';
        const { existe, produto } = verificarProdutoExiste(codigo, codigoBarras);
        
        itensPreview.push({
          codigo,
          codigoBarras: codigoBarras || undefined,
          nome: prod.getElementsByTagName('xProd')[0]?.textContent || '',
          ncm: prod.getElementsByTagName('NCM')[0]?.textContent || '',
          cfop: prod.getElementsByTagName('CFOP')[0]?.textContent || '',
          cst: imposto?.getElementsByTagName('CST')[0]?.textContent || imposto?.getElementsByTagName('CSOSN')[0]?.textContent || '',
          unidade: prod.getElementsByTagName('uCom')[0]?.textContent || '',
          quantidade: parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0'),
          valorUnitario: parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0'),
          valorTotal: parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0'),
          enviarEstoque: true, // Por padrão envia para estoque
          produtoExiste: existe,
          produtoId: produto?.id,
          categoriaId: produto?.categoriaId,
        });
      }
    }

    const cnpjEmitente = emit.getElementsByTagName('CNPJ')[0]?.textContent || emit.getElementsByTagName('CPF')[0]?.textContent || '';
    const fornecedorExiste = await verificarFornecedorExiste(cnpjEmitente);

    return {
      numero: ide.getElementsByTagName('nNF')[0]?.textContent || '',
      serie: ide.getElementsByTagName('serie')[0]?.textContent || '',
      dataEmissao: new Date(ide.getElementsByTagName('dhEmi')[0]?.textContent || new Date()),
      emitente: {
        nome: emit.getElementsByTagName('xNome')[0]?.textContent || '',
        cnpj: cnpjEmitente,
        ie: emit.getElementsByTagName('IE')[0]?.textContent || '',
        endereco: enderecoEmitente
      },
      destinatario: {
        nome: dest?.getElementsByTagName('xNome')[0]?.textContent || 'Não informado',
        cnpj: dest?.getElementsByTagName('CNPJ')[0]?.textContent || dest?.getElementsByTagName('CPF')[0]?.textContent || '',
        ie: dest?.getElementsByTagName('IE')[0]?.textContent || '',
        endereco: enderecoDestinatario
      },
      valorTotal: parseFloat(total.getElementsByTagName('vNF')[0]?.textContent || '0'),
      valorProdutos: parseFloat(total.getElementsByTagName('vProd')[0]?.textContent || '0'),
      itens: itensPreview,
      xmlContent: content,
      fornecedorExiste
    };
  };

  // Handler para importar XML - mostra preview
  const handleImportarXML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xml')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Selecione um arquivo XML.' });
      return;
    }

    if (!activeTenant?.id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Tenant não identificado. Faça login novamente.' });
      return;
    }

    setImportando(true);
    try {
      const content = await file.text();
      const preview = await parseXML(content);
      
      // Data de vencimento padrão: 30 dias
      const vencimentoPadrao = new Date();
      vencimentoPadrao.setDate(vencimentoPadrao.getDate() + 30);
      setDataVencimento(vencimentoPadrao.toISOString().split('T')[0]);
      
      setPreviewData(preview);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ variant: 'destructive', title: 'Erro na importação', description: errorMsg });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle enviar para estoque
  const toggleEnviarEstoque = (index: number) => {
    if (!previewData) return;
    const novosItens = [...previewData.itens];
    novosItens[index].enviarEstoque = !novosItens[index].enviarEstoque;
    setPreviewData({ ...previewData, itens: novosItens });
  };

  // Atualizar categoria do item
  const atualizarCategoriaItem = (index: number, categoriaId: string) => {
    if (!previewData) return;
    const novosItens = [...previewData.itens];
    novosItens[index].categoriaId = categoriaId;
    setPreviewData({ ...previewData, itens: novosItens });
  };

  // Confirmar importação
  const confirmarImportacao = async () => {
    if (!previewData || !activeTenant?.id) return;
    
    setSalvando(true);
    try {
      // 1. Cadastrar fornecedor se não existir
      if (!previewData.fornecedorExiste) {
        const novoFornecedor: Fornecedor = {
          id: `forn-${Date.now()}`,
          tenantId: activeTenant.id,
          nome: previewData.emitente.nome,
          razaoSocial: previewData.emitente.nome,
          cnpj: previewData.emitente.cnpj.replace(/\D/g, ''),
          inscricaoEstadual: previewData.emitente.ie,
          email: '',
          telefone: '',
          endereco: previewData.emitente.endereco,
          contato: '',
          ativo: true,
          dataCriacao: new Date(),
        };
        await addFornecedor(novoFornecedor);
        toast({ title: 'Fornecedor cadastrado', description: `${previewData.emitente.nome} foi cadastrado como fornecedor.` });
      }

      // 2. Cadastrar produtos que não existem
      for (const item of previewData.itens) {
        if (!item.produtoExiste) {
          // Verificar se tem categoria
          if (!item.categoriaId) {
            toast({ 
              variant: 'destructive', 
              title: 'Categoria obrigatória', 
              description: `Selecione uma categoria para o produto "${item.nome}"` 
            });
            setSalvando(false);
            return;
          }

          const novoProduto: Produto = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tenantId: activeTenant.id,
            codigo: item.codigo,
            codigoBarras: item.codigoBarras,
            nome: item.nome,
            descricao: '',
            tipo: 'produto',
            categoriaId: item.categoriaId,
            ncm: item.ncm,
            cst: item.cst || '000',
            cfop: item.cfop,
            icms: 0,
            pis: 0,
            cofins: 0,
            unidade: item.unidade || 'UN',
            precoCusto: item.valorUnitario,
            precoVenda: item.valorUnitario * 1.3, // 30% de margem padrão
            estoqueAtual: item.enviarEstoque ? item.quantidade : 0,
            estoqueMinimo: 0,
            atalhoPDV: false,
            ativo: true,
            dataCriacao: new Date(),
            dataAtualizacao: new Date(),
          };
          await addProduto(novoProduto);
          item.produtoId = novoProduto.id;
        } else if (item.enviarEstoque && item.produtoId) {
          // 3. Atualizar estoque do produto existente
          await movimentarEstoque(item.produtoId, 'entrada', item.quantidade, `NFe ${previewData.numero}`);
        }
      }

      // 4. Criar a nota fiscal
      const nota: NotaFiscal = {
        id: `nf-${Date.now()}`,
        tenantId: activeTenant.id,
        numero: previewData.numero,
        serie: previewData.serie,
        chave: '',
        tipo: 'entrada',
        modelo: 'NF-e',
        emitente: { 
          nome: previewData.emitente.nome, 
          cnpj: previewData.emitente.cnpj, 
          ie: previewData.emitente.ie,
          endereco: previewData.emitente.endereco
        },
        destinatario: { 
          nome: previewData.destinatario.nome, 
          cnpj: previewData.destinatario.cnpj, 
          ie: previewData.destinatario.ie,
          endereco: previewData.destinatario.endereco
        },
        valorTotal: previewData.valorTotal,
        valorProdutos: previewData.valorProdutos,
        valorServicos: 0,
        valorDesconto: 0,
        valorFrete: 0,
        valorSeguro: 0,
        valorICMS: 0,
        valorPIS: 0,
        valorCOFINS: 0,
        dataEmissao: previewData.dataEmissao,
        xmlUrl: '',
        xmlConteudo: previewData.xmlContent,
        status: 'autorizada',
        produtos: previewData.itens.map(item => ({
          codigo: item.codigo,
          codigoBarras: item.codigoBarras,
          nome: item.nome,
          ncm: item.ncm,
          cfop: item.cfop,
          cst: item.cst,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
        }))
      };
      
      await addNotaFiscal(nota, activeTenant.id);

      // 5. Gerar conta a pagar se selecionado
      if (gerarContaPagar && dataVencimento) {
        const fornecedor = fornecedores.find(f => 
          f.cnpj.replace(/\D/g, '') === previewData.emitente.cnpj.replace(/\D/g, '')
        );
        
        await addContaPagar({
          id: `cp-${Date.now()}`,
          tenantId: activeTenant.id,
          descricao: `NFe ${previewData.numero} - ${previewData.emitente.nome}`,
          valor: previewData.valorTotal,
          vencimento: new Date(dataVencimento),
          status: 'pendente',
          categoria: 'Fornecedores',
          fornecedorId: fornecedor?.id,
          observacoes: `Importado da NFe ${previewData.numero}`,
          recorrente: false,
        });
        toast({ title: 'Conta a pagar criada', description: `Vencimento: ${new Date(dataVencimento).toLocaleDateString('pt-BR')}` });
      }

      toast({ title: 'NFe importada com sucesso!', description: `NFe #${previewData.numero} foi processada.` });
      setPreviewOpen(false);
      setPreviewData(null);
      setGerarContaPagar(false);
    } catch (error) {
      console.error('Erro ao confirmar importação:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível processar a NFe.' });
    } finally {
      setSalvando(false);
    }
  };

  // Excluir nota
  const handleDelete = async (nota: NotaFiscal) => {
    if (!confirm(`Tem certeza que deseja excluir a NFe #${nota.numero}?`)) return;
    
    try {
      await deleteNotaFiscal(nota.id, activeTenant?.id);
      toast({ title: 'NFe excluída', description: `NFe #${nota.numero} foi removida.` });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir a NFe.' });
    }
  };

  const handleBaixar = (nota: NotaFiscal) => {
    if (nota.xmlConteudo) {
      const blob = new Blob([nota.xmlConteudo], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFe_${nota.numero}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast({ title: 'Download iniciado', description: `Baixando XML da NFe #${nota.numero}...` });
  };

  const handleImprimir = (nota: NotaFiscal) => {
    toast({ title: 'Enviando para impressão', description: `NFe #${nota.numero} enviada para a impressora.` });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nota Fiscal Eletrônica</h1>
            <p className="text-gray-600">Importação e gestão de NFe</p>
          </div>
        </div>

        {/* Abas de Tipo */}
        <div className="flex gap-2 border-b items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={tipoFilter === 'todos' ? 'default' : 'ghost'}
              onClick={() => setTipoFilter('todos')}
              className="rounded-b-none"
            >
              Todas as NFe
            </Button>
            <Button
              variant={tipoFilter === 'entrada' ? 'default' : 'ghost'}
              onClick={() => setTipoFilter('entrada')}
              className="rounded-b-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              Entrada
            </Button>
            <Button
              variant={tipoFilter === 'saida' ? 'default' : 'ghost'}
              onClick={() => setTipoFilter('saida')}
              className="rounded-b-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              Saída
            </Button>
          </div>
          {tipoFilter === 'entrada' && (
            <div className="flex gap-2 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={handleImportarXML}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={importando}
                className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {importando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar XML
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de NFe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredNotas.reduce((acc, n) => acc + n.valorTotal, 0))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{filteredNotas.length} notas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntrada)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{notasEntrada.length} notas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saída</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaida)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{notasSaida.length} notas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Autorizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredNotas.filter(n => n.status === 'autorizada').length}</div>
              <p className="text-xs text-gray-500 mt-1">Emitidas com sucesso</p>
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
                <Label htmlFor="search">Buscar por número, cliente ou fornecedor</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite..."
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
                  <option value="autorizada">Autorizada</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="rejeitada">Rejeitada</option>
                  <option value="denegada">Denegada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de NFe */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Fiscais</CardTitle>
            <CardDescription>
              Exibindo {filteredNotas.length} de {notasFiscais.length} notas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Fornecedor/Cliente</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotas.length > 0 ? (
                    filteredNotas.map((nota) => (
                      <TableRow key={nota.id} className={nota.tipo === 'entrada' ? 'bg-blue-50/50' : 'bg-purple-50/50'}>
                        <TableCell>{getTipoBadge(nota.tipo)}</TableCell>
                        <TableCell className="font-medium">{nota.numero}</TableCell>
                        <TableCell>{nota.serie}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{nota.tipo === 'entrada' ? nota.emitente.nome : nota.destinatario.nome}</p>
                            <p className="text-xs text-muted-foreground">{nota.tipo === 'entrada' ? nota.emitente.cnpj : nota.destinatario.cnpj}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valorTotal)}
                        </TableCell>
                        <TableCell>{getStatusBadge(nota.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedNota(nota);
                                setDialogOpen(true);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBaixar(nota)}
                              title="Baixar XML"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {nota.status === 'autorizada' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImprimir(nota)}
                                title="Imprimir"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(nota)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma nota fiscal encontrada</p>
                        <p className="text-sm">Importe um XML de NFe para começar</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Dialog de Preview da Importação */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview da NFe #{previewData?.numero}
              </DialogTitle>
              <DialogDescription>
                Revise as informações antes de confirmar a importação
              </DialogDescription>
            </DialogHeader>

            {previewData && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Alertas */}
                {!previewData.fornecedorExiste && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-3 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Fornecedor não cadastrado</p>
                        <p className="text-sm text-yellow-700">
                          O fornecedor <strong>{previewData.emitente.nome}</strong> será cadastrado automaticamente.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {previewData.itens.some(i => !i.produtoExiste) && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="py-3 flex items-center gap-3">
                      <Package className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Produtos não cadastrados</p>
                        <p className="text-sm text-orange-700">
                          {previewData.itens.filter(i => !i.produtoExiste).length} produto(s) serão cadastrados. Selecione as categorias.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informações Gerais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-600">Número</Label>
                    <p className="font-bold text-lg">{previewData.numero}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Série</Label>
                    <p className="font-bold text-lg">{previewData.serie}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Data Emissão</Label>
                    <p className="font-bold text-lg">{new Date(previewData.dataEmissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Valor Total</Label>
                    <p className="font-bold text-lg text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previewData.valorTotal)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Emitente e Destinatário */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Emitente (Fornecedor)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="font-medium">{previewData.emitente.nome}</p>
                      <p className="text-gray-600">CNPJ: {previewData.emitente.cnpj}</p>
                      {previewData.emitente.ie && <p className="text-gray-600">IE: {previewData.emitente.ie}</p>}
                      <p className="text-gray-500 text-xs mt-1">
                        {previewData.emitente.endereco.cidade} - {previewData.emitente.endereco.estado}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Destinatário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="font-medium">{previewData.destinatario.nome}</p>
                      <p className="text-gray-600">CNPJ: {previewData.destinatario.cnpj || 'Não informado'}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {previewData.destinatario.endereco.cidade} - {previewData.destinatario.endereco.estado}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Produtos */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos ({previewData.itens.length} itens)
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">Estoque</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Categoria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.itens.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                checked={item.enviarEstoque}
                                onCheckedChange={() => toggleEnviarEstoque(index)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{item.nome}</p>
                                <p className="text-xs text-gray-500">NCM: {item.ncm}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.quantidade} {item.unidade}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitario)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotal)}
                            </TableCell>
                            <TableCell>
                              {item.produtoExiste ? (
                              <Badge className="bg-green-100 text-green-800">Cadastrado</Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-800">Novo</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!item.produtoExiste ? (
                                <Select
                                  value={item.categoriaId || ''}
                                  onValueChange={(value) => atualizarCategoriaItem(index, value)}
                                >
                                  <SelectTrigger className="h-8 w-40">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categorias.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  {categorias.find(c => c.id === item.categoriaId)?.nome || '-'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Opções de Conta a Pagar */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id="gerar-conta"
                        checked={gerarContaPagar}
                        onCheckedChange={(checked) => setGerarContaPagar(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="gerar-conta" className="font-medium cursor-pointer flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Gerar Conta a Pagar
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Crie uma conta a pagar para esta NFe no financeiro.
                        </p>
                        {gerarContaPagar && (
                          <div className="mt-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Label className="text-sm">Vencimento:</Label>
                            <Input
                              type="date"
                              value={dataVencimento}
                              onChange={(e) => setDataVencimento(e.target.value)}
                              className="w-44"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={confirmarImportacao}
                disabled={salvando}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da NFe #{selectedNota?.numero}</DialogTitle>
            </DialogHeader>

            {selectedNota && (
              <div className="space-y-4">
                {/* Informações Gerais */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Número</Label>
                    <p className="font-medium">{selectedNota.numero}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Série</Label>
                    <p className="font-medium">{selectedNota.serie}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Modelo</Label>
                    <p className="font-medium">{selectedNota.modelo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Tipo</Label>
                    <p className="font-medium capitalize">{selectedNota.tipo}</p>
                  </div>
                </div>

                <Separator />

                {/* Emitente e Destinatário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 mb-2 block flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Emitente
                    </Label>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedNota.emitente.nome}</p>
                      <p>{selectedNota.emitente.cnpj}</p>
                      {selectedNota.emitente.ie && <p>IE: {selectedNota.emitente.ie}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600 mb-2 block flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Destinatário
                    </Label>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedNota.destinatario.nome}</p>
                      <p>{selectedNota.destinatario.cnpj}</p>
                      {selectedNota.destinatario.ie && <p>IE: {selectedNota.destinatario.ie}</p>}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Produtos */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Produtos/Serviços</Label>
                  <div className="space-y-2">
                    {selectedNota.produtos.map((produto, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between font-medium">
                          <span>{produto.nome}</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valorTotal)}</span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          {produto.quantidade} {produto.unidade} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valorUnitario)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valor Produtos:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedNota.valorProdutos)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedNota.valorTotal)}</span>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedNota.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Data Emissão</Label>
                    <p className="font-medium">{new Date(selectedNota.dataEmissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
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
