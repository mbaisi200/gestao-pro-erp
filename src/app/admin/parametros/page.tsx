'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Building2,
  FileText,
  CreditCard,
  Printer,
  Save,
  Plus,
  Trash2,
  Edit,
  Shield,
  CheckCircle,
  AlertTriangle,
  Upload,
  Calendar,
} from 'lucide-react';

export default function ParametrosPage() {
  const { user, tenant } = useAuthStore();
  const { bancos, impressoras, addBanco, deleteBanco, addImpressora, deleteImpressora } = useAppStore();
  const { toast } = useToast();

  // Estados para dados da empresa
  const [empresaData, setEmpresaData] = useState({
    nome: tenant?.nome || '',
    cnpj: tenant?.cnpj || '',
    email: tenant?.email || '',
    telefone: tenant?.telefone || '',
    inscricaoEstadual: tenant?.inscricaoEstadual || '',
    inscricaoMunicipal: tenant?.inscricaoMunicipal || '',
    regimeTributario: tenant?.regimeTributario || 'simples',
    cnae: tenant?.cnae || '',
    // Endereço
    logradouro: tenant?.endereco?.logradouro || '',
    numero: tenant?.endereco?.numero || '',
    complemento: tenant?.endereco?.complemento || '',
    bairro: tenant?.endereco?.bairro || '',
    cidade: tenant?.endereco?.cidade || '',
    estado: tenant?.endereco?.estado || '',
    cep: tenant?.endereco?.cep || '',
  });

  // Estados para configurações fiscais
  const [fiscalData, setFiscalData] = useState({
    serieNFe: 1,
    serieNFCe: 1,
    proximoNumeroNFe: 1000,
    proximoNumeroNFCe: 1000,
    ambiente: 'homologacao' as 'producao' | 'homologacao',
    emailContador: '',
    icmsPadrao: 18,
    pisPadrao: 1.65,
    cofinsPadrao: 7.6,
  });

  // Estados para certificado
  const [certificadoData, setCertificadoData] = useState({
    arquivoUrl: '',
    senha: '',
    vencimento: '',
  });

  // Dialog states
  const [dialogBanco, setDialogBanco] = useState(false);
  const [dialogImpressora, setDialogImpressora] = useState(false);
  const [novoBanco, setNovoBanco] = useState({
    nome: '',
    codigo: '',
    agencia: '',
    conta: '',
    tipoConta: 'corrente' as 'corrente' | 'poupanca',
    chavePix: '',
  });
  const [novaImpressora, setNovaImpressora] = useState({
    nome: '',
    modelo: '',
    marca: '',
    porta: 'USB',
    ip: '',
    colunas: 80,
  });

  const handleSalvarEmpresa = () => {
    toast({
      title: 'Dados salvos!',
      description: 'As informações da empresa foram atualizadas.',
    });
  };

  const handleSalvarFiscal = () => {
    toast({
      title: 'Configurações fiscais salvas!',
      description: 'As configurações fiscais foram atualizadas.',
    });
  };

  const handleSalvarCertificado = () => {
    toast({
      title: 'Certificado salvo!',
      description: 'O certificado digital foi configurado.',
    });
  };

  const handleAdicionarBanco = () => {
    if (!novoBanco.nome || !novoBanco.agencia || !novoBanco.conta) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    addBanco({
      id: `banco-${Date.now()}`,
      tenantId: tenant?.id || '',
      ...novoBanco,
      ativo: true,
    });

    setNovoBanco({
      nome: '',
      codigo: '',
      agencia: '',
      conta: '',
      tipoConta: 'corrente',
      chavePix: '',
    });
    setDialogBanco(false);
    toast({ title: 'Banco adicionado!' });
  };

  const handleAdicionarImpressora = () => {
    if (!novaImpressora.nome || !novaImpressora.modelo) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    addImpressora({
      id: `impressora-${Date.now()}`,
      tenantId: tenant?.id || '',
      ...novaImpressora,
      margemSuperior: 0,
      margemInferior: 0,
      margemEsquerda: 0,
      margemDireita: 0,
      ativo: true,
      principal: impressoras.length === 0,
    });

    setNovaImpressora({
      nome: '',
      modelo: '',
      marca: '',
      porta: 'USB',
      ip: '',
      colunas: 80,
    });
    setDialogImpressora(false);
    toast({ title: 'Impressora adicionada!' });
  };

  return (
    <MainLayout
      breadcrumbs={[
        { title: 'Admin' },
        { title: 'Parâmetros' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Parâmetros do Sistema</h1>
            <p className="text-muted-foreground">
              Configure os dados da empresa, notas fiscais e integrações
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Shield className="h-4 w-4 mr-2" />
            Plano: {tenant?.plano?.toUpperCase() || 'BASIC'}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fiscal</span>
            </TabsTrigger>
            <TabsTrigger value="certificado" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Certificado</span>
            </TabsTrigger>
            <TabsTrigger value="bancos" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Bancos</span>
            </TabsTrigger>
            <TabsTrigger value="impressoras" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Impressoras</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dados da Empresa */}
          <TabsContent value="empresa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações que aparecerão nos documentos fiscais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Razão Social *</Label>
                    <Input
                      id="nome"
                      value={empresaData.nome}
                      onChange={(e) => setEmpresaData({ ...empresaData, nome: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={empresaData.cnpj}
                      onChange={(e) => setEmpresaData({ ...empresaData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={empresaData.email}
                      onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })}
                      placeholder="empresa@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={empresaData.telefone}
                      onChange={(e) => setEmpresaData({ ...empresaData, telefone: e.target.value })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={empresaData.inscricaoEstadual}
                      onChange={(e) => setEmpresaData({ ...empresaData, inscricaoEstadual: e.target.value })}
                      placeholder="000.000.000.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricaoMunicipal"
                      value={empresaData.inscricaoMunicipal}
                      onChange={(e) => setEmpresaData({ ...empresaData, inscricaoMunicipal: e.target.value })}
                      placeholder="000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnae">CNAE</Label>
                    <Input
                      id="cnae"
                      value={empresaData.cnae}
                      onChange={(e) => setEmpresaData({ ...empresaData, cnae: e.target.value })}
                      placeholder="0000-0/00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regimeTributario">Regime Tributário</Label>
                  <Select
                    value={empresaData.regimeTributario}
                    onValueChange={(value) => setEmpresaData({ ...empresaData, regimeTributario: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <h3 className="text-lg font-semibold">Endereço</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={empresaData.logradouro}
                      onChange={(e) => setEmpresaData({ ...empresaData, logradouro: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={empresaData.numero}
                      onChange={(e) => setEmpresaData({ ...empresaData, numero: e.target.value })}
                      placeholder="000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={empresaData.complemento}
                      onChange={(e) => setEmpresaData({ ...empresaData, complemento: e.target.value })}
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={empresaData.bairro}
                      onChange={(e) => setEmpresaData({ ...empresaData, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={empresaData.cep}
                      onChange={(e) => setEmpresaData({ ...empresaData, cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={empresaData.cidade}
                      onChange={(e) => setEmpresaData({ ...empresaData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={empresaData.estado}
                      onChange={(e) => setEmpresaData({ ...empresaData, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSalvarEmpresa} className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configurações Fiscais */}
          <TabsContent value="fiscal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Fiscais</CardTitle>
                <CardDescription>Parâmetros para emissão de NF-e e NFC-e</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-4">NF-e (Nota Fiscal Eletrônica)</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serieNFe">Série</Label>
                        <Input
                          id="serieNFe"
                          type="number"
                          value={fiscalData.serieNFe}
                          onChange={(e) => setFiscalData({ ...fiscalData, serieNFe: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proximoNumeroNFe">Próximo Número</Label>
                        <Input
                          id="proximoNumeroNFe"
                          type="number"
                          value={fiscalData.proximoNumeroNFe}
                          onChange={(e) => setFiscalData({ ...fiscalData, proximoNumeroNFe: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-green-100 bg-green-50">
                    <h4 className="font-semibold text-green-800 mb-4">NFC-e (Cupom Fiscal Eletrônico)</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serieNFCe">Série</Label>
                        <Input
                          id="serieNFCe"
                          type="number"
                          value={fiscalData.serieNFCe}
                          onChange={(e) => setFiscalData({ ...fiscalData, serieNFCe: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proximoNumeroNFCe">Próximo Número</Label>
                        <Input
                          id="proximoNumeroNFCe"
                          type="number"
                          value={fiscalData.proximoNumeroNFCe}
                          onChange={(e) => setFiscalData({ ...fiscalData, proximoNumeroNFCe: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ambiente">Ambiente de Emissão</Label>
                    <Select
                      value={fiscalData.ambiente}
                      onValueChange={(value) => setFiscalData({ ...fiscalData, ambiente: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailContador">Email do Contador</Label>
                    <Input
                      id="emailContador"
                      type="email"
                      value={fiscalData.emailContador}
                      onChange={(e) => setFiscalData({ ...fiscalData, emailContador: e.target.value })}
                      placeholder="contador@empresa.com"
                    />
                  </div>
                </div>

                <Separator />

                <h4 className="font-semibold">Alíquotas Padrão (%)</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icmsPadrao">ICMS Padrão</Label>
                    <Input
                      id="icmsPadrao"
                      type="number"
                      step="0.01"
                      value={fiscalData.icmsPadrao}
                      onChange={(e) => setFiscalData({ ...fiscalData, icmsPadrao: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pisPadrao">PIS Padrão</Label>
                    <Input
                      id="pisPadrao"
                      type="number"
                      step="0.01"
                      value={fiscalData.pisPadrao}
                      onChange={(e) => setFiscalData({ ...fiscalData, pisPadrao: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cofinsPadrao">COFINS Padrão</Label>
                    <Input
                      id="cofinsPadrao"
                      type="number"
                      step="0.01"
                      value={fiscalData.cofinsPadrao}
                      onChange={(e) => setFiscalData({ ...fiscalData, cofinsPadrao: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSalvarFiscal} className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Certificado Digital */}
          <TabsContent value="certificado" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificado Digital</CardTitle>
                <CardDescription>Configuração do certificado A1 para assinatura de documentos fiscais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">Importante</p>
                      <p className="text-sm text-amber-700">
                        O certificado digital é necessário para emissão de NF-e e NFC-e.
                        Use um certificado A1 válido no formato .pfx ou .p12.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Arquivo do Certificado (.pfx/.p12)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={certificadoData.arquivoUrl}
                        onChange={(e) => setCertificadoData({ ...certificadoData, arquivoUrl: e.target.value })}
                        placeholder="Selecione o arquivo..."
                        readOnly
                      />
                      <Button variant="outline">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senhaCert">Senha do Certificado</Label>
                    <Input
                      id="senhaCert"
                      type="password"
                      value={certificadoData.senha}
                      onChange={(e) => setCertificadoData({ ...certificadoData, senha: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vencimento">Data de Vencimento</Label>
                  <Input
                    id="vencimento"
                    type="date"
                    value={certificadoData.vencimento}
                    onChange={(e) => setCertificadoData({ ...certificadoData, vencimento: e.target.value })}
                  />
                </div>

                {/* Status do Certificado */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Status do Certificado</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Nenhum certificado configurado</p>
                      <p className="text-sm text-muted-foreground">Faça upload do certificado para habilitar a emissão</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSalvarCertificado} className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Certificado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Bancos */}
          <TabsContent value="bancos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Contas Bancárias</CardTitle>
                    <CardDescription>Configure suas contas bancárias para integração</CardDescription>
                  </div>
                  <Dialog open={dialogBanco} onOpenChange={setDialogBanco}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Banco
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Conta Bancária</DialogTitle>
                        <DialogDescription>
                          Cadastre uma nova conta bancária
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bancoNome">Banco *</Label>
                            <Select
                              value={novoBanco.codigo}
                              onValueChange={(value) => {
                                const bancos: Record<string, string> = {
                                  '001': 'Banco do Brasil',
                                  '237': 'Bradesco',
                                  '341': 'Itaú',
                                  '033': 'Santander',
                                  '104': 'Caixa Econômica Federal',
                                  '077': 'Banco Inter',
                                  '260': 'Nubank',
                                  '208': 'BTG Pactual',
                                  '422': 'Banco Safra',
                                  '655': 'Banco Votorantim',
                                  '318': 'Banco BMG',
                                  '623': 'Banco Pan',
                                  '212': 'Banco Original',
                                  '336': 'Banco C6',
                                  '320': 'Banco Digio',
                                  '735': 'Banco Neon',
                                  '290': 'PagSeguro',
                                  '323': 'Mercado Pago',
                                  '748': 'Sicredi',
                                  '756': 'Sicoob',
                                  '041': 'Banrisul',
                                  '070': 'BRB',
                                  '637': 'Banco BV',
                                  '021': 'Banestes',
                                  '004': 'BNDES',
                                  '025': 'Banco Alfa',
                                  '063': 'Banco Ipb',
                                  '074': 'Banco J. Safra',
                                  '084': 'Uniprime',
                                  '094': 'Banco Itaú BBA',
                                };
                                setNovoBanco({ ...novoBanco, codigo: value, nome: bancos[value] || '' });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o banco" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                <SelectItem value="001">001 - Banco do Brasil</SelectItem>
                                <SelectItem value="237">237 - Bradesco</SelectItem>
                                <SelectItem value="341">341 - Itaú</SelectItem>
                                <SelectItem value="033">033 - Santander</SelectItem>
                                <SelectItem value="104">104 - Caixa Econômica Federal</SelectItem>
                                <SelectItem value="077">077 - Banco Inter</SelectItem>
                                <SelectItem value="260">260 - Nubank</SelectItem>
                                <SelectItem value="208">208 - BTG Pactual</SelectItem>
                                <SelectItem value="422">422 - Banco Safra</SelectItem>
                                <SelectItem value="655">655 - Banco Votorantim</SelectItem>
                                <SelectItem value="318">318 - Banco BMG</SelectItem>
                                <SelectItem value="623">623 - Banco Pan</SelectItem>
                                <SelectItem value="212">212 - Banco Original</SelectItem>
                                <SelectItem value="336">336 - Banco C6</SelectItem>
                                <SelectItem value="320">320 - Banco Digio</SelectItem>
                                <SelectItem value="735">735 - Banco Neon</SelectItem>
                                <SelectItem value="290">290 - PagSeguro</SelectItem>
                                <SelectItem value="323">323 - Mercado Pago</SelectItem>
                                <SelectItem value="748">748 - Sicredi</SelectItem>
                                <SelectItem value="756">756 - Sicoob</SelectItem>
                                <SelectItem value="041">041 - Banrisul</SelectItem>
                                <SelectItem value="070">070 - BRB</SelectItem>
                                <SelectItem value="637">637 - Banco BV</SelectItem>
                                <SelectItem value="021">021 - Banestes</SelectItem>
                                <SelectItem value="004">004 - BNDES</SelectItem>
                                <SelectItem value="025">025 - Banco Alfa</SelectItem>
                                <SelectItem value="063">063 - Banco Ipb</SelectItem>
                                <SelectItem value="074">074 - Banco J. Safra</SelectItem>
                                <SelectItem value="084">084 - Uniprime</SelectItem>
                                <SelectItem value="094">094 - Banco Itaú BBA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tipoConta">Tipo de Conta</Label>
                            <Select
                              value={novoBanco.tipoConta}
                              onValueChange={(value) => setNovoBanco({ ...novoBanco, tipoConta: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="corrente">Corrente</SelectItem>
                                <SelectItem value="poupanca">Poupança</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="agencia">Agência *</Label>
                            <Input
                              id="agencia"
                              value={novoBanco.agencia}
                              onChange={(e) => setNovoBanco({ ...novoBanco, agencia: e.target.value })}
                              placeholder="0000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="conta">Conta *</Label>
                            <Input
                              id="conta"
                              value={novoBanco.conta}
                              onChange={(e) => setNovoBanco({ ...novoBanco, conta: e.target.value })}
                              placeholder="00000-0"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chavePix">Chave PIX</Label>
                          <Input
                            id="chavePix"
                            value={novoBanco.chavePix}
                            onChange={(e) => setNovoBanco({ ...novoBanco, chavePix: e.target.value })}
                            placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogBanco(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAdicionarBanco}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {bancos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhuma conta bancária cadastrada</p>
                    <p className="text-sm">Clique em "Adicionar Banco" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bancos.map((banco) => (
                      <div
                        key={banco.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{banco.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              Ag: {banco.agencia} | Conta: {banco.conta}
                            </p>
                            {banco.chavePix && (
                              <p className="text-xs text-green-600">PIX: {banco.chavePix}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={banco.ativo ? 'default' : 'secondary'}>
                            {banco.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => deleteBanco(banco.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Impressoras */}
          <TabsContent value="impressoras" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Impressoras</CardTitle>
                    <CardDescription>Configure impressoras para cupons e documentos</CardDescription>
                  </div>
                  <Dialog open={dialogImpressora} onOpenChange={setDialogImpressora}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Impressora
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Impressora</DialogTitle>
                        <DialogDescription>
                          Cadastre uma nova impressora
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="impressoraNome">Nome *</Label>
                            <Input
                              id="impressoraNome"
                              value={novaImpressora.nome}
                              onChange={(e) => setNovaImpressora({ ...novaImpressora, nome: e.target.value })}
                              placeholder="Ex: Cupom Caixa"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="marca">Marca</Label>
                            <Input
                              id="marca"
                              value={novaImpressora.marca}
                              onChange={(e) => setNovaImpressora({ ...novaImpressora, marca: e.target.value })}
                              placeholder="Ex: Bematech, Elgin"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="modelo">Modelo *</Label>
                            <Input
                              id="modelo"
                              value={novaImpressora.modelo}
                              onChange={(e) => setNovaImpressora({ ...novaImpressora, modelo: e.target.value })}
                              placeholder="Ex: MP-4200 TH"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="porta">Porta</Label>
                            <Select
                              value={novaImpressora.porta}
                              onValueChange={(value) => setNovaImpressora({ ...novaImpressora, porta: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USB">USB</SelectItem>
                                <SelectItem value="COM1">COM1</SelectItem>
                                <SelectItem value="COM2">COM2</SelectItem>
                                <SelectItem value="Network">Rede</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {novaImpressora.porta === 'Network' && (
                          <div className="space-y-2">
                            <Label htmlFor="ip">Endereço IP</Label>
                            <Input
                              id="ip"
                              value={novaImpressora.ip}
                              onChange={(e) => setNovaImpressora({ ...novaImpressora, ip: e.target.value })}
                              placeholder="192.168.1.100"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="colunas">Colunas</Label>
                          <Select
                            value={novaImpressora.colunas.toString()}
                            onValueChange={(value) => setNovaImpressora({ ...novaImpressora, colunas: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="48">48 colunas (58mm)</SelectItem>
                              <SelectItem value="80">80 colunas (80mm)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogImpressora(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAdicionarImpressora}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {impressoras.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhuma impressora cadastrada</p>
                    <p className="text-sm">Clique em "Adicionar Impressora" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {impressoras.map((impressora) => (
                      <div
                        key={impressora.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Printer className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{impressora.nome}</p>
                              {impressora.principal && (
                                <Badge className="bg-purple-500">Principal</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {impressora.marca} {impressora.modelo} | {impressora.porta}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {impressora.colunas} colunas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={impressora.ativo ? 'default' : 'secondary'}>
                            {impressora.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => deleteImpressora(impressora.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
