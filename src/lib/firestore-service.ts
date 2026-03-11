import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { Produto, Categoria, ContaPagar, ContaReceber, Venda, Pedido, NotaFiscal, OrdemServico, Cliente, Tenant, Funcionario, Fornecedor, UnidadeMedida } from '@/types';

// Helper para remover campos undefined de um objeto (Firestore não aceita undefined)
function removeUndefinedFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

// ========== TENANT ==========
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const docRef = doc(db, 'tenants', tenantId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataExpiracao: data.dataExpiracao?.toDate() || new Date()
    } as Tenant;
  }
  return null;
}

export async function createTenant(tenant: Tenant): Promise<void> {
  const docRef = doc(db, 'tenants', tenant.id);
  await setDoc(docRef, {
    ...tenant,
    dataCriacao: serverTimestamp(),
    dataExpiracao: Timestamp.fromDate(tenant.dataExpiracao)
  });
}

// ========== PRODUTOS ==========
const getProdutosCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'produtos');

export async function getProdutos(tenantId: string): Promise<Produto[]> {
  const q = query(getProdutosCollection(tenantId), orderBy('nome'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date()
    } as Produto;
  });
}

export async function getProduto(tenantId: string, produtoId: string): Promise<Produto | null> {
  const docRef = doc(db, 'tenants', tenantId, 'produtos', produtoId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date()
    } as Produto;
  }
  return null;
}

export async function createProduto(tenantId: string, produto: Produto): Promise<void> {
  const docRef = doc(getProdutosCollection(tenantId));
  const cleanData = removeUndefinedFields({
    ...produto,
    id: docRef.id,
    tenantId,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp()
  });
  await setDoc(docRef, cleanData);
}

export async function updateProduto(tenantId: string, produtoId: string, data: Partial<Produto>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'produtos', produtoId);
  const cleanData = removeUndefinedFields({
    ...data,
    dataAtualizacao: serverTimestamp()
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteProduto(tenantId: string, produtoId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'produtos', produtoId);
  await deleteDoc(docRef);
}

// ========== CATEGORIAS ==========
const getCategoriasCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'categorias');

export async function getCategorias(tenantId: string): Promise<Categoria[]> {
  const q = query(getCategoriasCollection(tenantId), orderBy('nome'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Categoria));
}

export async function createCategoria(tenantId: string, categoria: Categoria): Promise<void> {
  const docRef = doc(getCategoriasCollection(tenantId));
  await setDoc(docRef, {
    ...categoria,
    id: docRef.id,
    tenantId
  });
}

export async function updateCategoria(tenantId: string, categoriaId: string, data: Partial<Categoria>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'categorias', categoriaId);
  await updateDoc(docRef, data);
}

export async function deleteCategoria(tenantId: string, categoriaId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'categorias', categoriaId);
  await deleteDoc(docRef);
}

// ========== CONTAS A PAGAR ==========
const getContasPagarCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'contasPagar');

export async function getContasPagar(tenantId: string): Promise<ContaPagar[]> {
  const q = query(getContasPagarCollection(tenantId), orderBy('vencimento', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      vencimento: data.vencimento?.toDate() || new Date(),
      dataPagamento: data.dataPagamento?.toDate()
    } as ContaPagar;
  });
}

export async function createContaPagar(tenantId: string, conta: ContaPagar): Promise<void> {
  const docRef = doc(getContasPagarCollection(tenantId));
  await setDoc(docRef, {
    ...conta,
    id: docRef.id,
    tenantId,
    vencimento: Timestamp.fromDate(conta.vencimento)
  });
}

export async function updateContaPagar(tenantId: string, contaId: string, data: Partial<ContaPagar>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'contasPagar', contaId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.vencimento) updateData.vencimento = Timestamp.fromDate(data.vencimento);
  if (data.dataPagamento) updateData.dataPagamento = Timestamp.fromDate(data.dataPagamento);
  await updateDoc(docRef, updateData);
}

// ========== CONTAS A RECEBER ==========
const getContasReceberCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'contasReceber');

export async function getContasReceber(tenantId: string): Promise<ContaReceber[]> {
  const q = query(getContasReceberCollection(tenantId), orderBy('vencimento', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      vencimento: data.vencimento?.toDate() || new Date(),
      dataRecebimento: data.dataRecebimento?.toDate()
    } as ContaReceber;
  });
}

export async function createContaReceber(tenantId: string, conta: ContaReceber): Promise<void> {
  const docRef = doc(getContasReceberCollection(tenantId));
  await setDoc(docRef, {
    ...conta,
    id: docRef.id,
    tenantId,
    vencimento: Timestamp.fromDate(conta.vencimento)
  });
}

export async function updateContaReceber(tenantId: string, contaId: string, data: Partial<ContaReceber>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'contasReceber', contaId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.vencimento) updateData.vencimento = Timestamp.fromDate(data.vencimento);
  if (data.dataRecebimento) updateData.dataRecebimento = Timestamp.fromDate(data.dataRecebimento);
  await updateDoc(docRef, updateData);
}

// ========== VENDAS ==========
const getVendasCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'vendas');

export async function getVendas(tenantId: string): Promise<Venda[]> {
  const q = query(getVendasCollection(tenantId), orderBy('dataVenda', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataVenda: data.dataVenda?.toDate() || new Date()
    } as Venda;
  });
}

export async function createVenda(tenantId: string, venda: Venda): Promise<string> {
  const docRef = doc(getVendasCollection(tenantId));
  const cleanData = removeUndefinedFields({
    ...venda,
    id: docRef.id,
    tenantId,
    dataVenda: serverTimestamp()
  });
  await setDoc(docRef, cleanData);
  return docRef.id;
}

// ========== PEDIDOS ==========
const getPedidosCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'pedidos');

export async function getPedidos(tenantId: string): Promise<Pedido[]> {
  const q = query(getPedidosCollection(tenantId), orderBy('dataCriacao', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAprovacao: data.dataAprovacao?.toDate(),
      prazoEntrega: data.prazoEntrega?.toDate()
    } as Pedido;
  });
}

export async function createPedido(tenantId: string, pedido: Pedido): Promise<string> {
  const docRef = doc(getPedidosCollection(tenantId));
  await setDoc(docRef, {
    ...pedido,
    id: docRef.id,
    tenantId,
    dataCriacao: serverTimestamp()
  });
  return docRef.id;
}

export async function updatePedido(tenantId: string, pedidoId: string, data: Partial<Pedido>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'pedidos', pedidoId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.dataAprovacao) updateData.dataAprovacao = serverTimestamp();
  await updateDoc(docRef, updateData);
}

// ========== CLIENTES ==========
const getClientesCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'clientes');

export async function getClientes(tenantId: string): Promise<Cliente[]> {
  console.log('=== GET CLIENTES FIRESTORE SERVICE ===');
  console.log('tenantId:', tenantId);
  
  if (!tenantId) {
    console.error('ERRO: tenantId está vazio em getClientes!');
    return [];
  }
  
  try {
    const collectionRef = getClientesCollection(tenantId);
    console.log('Collection path:', collectionRef.path);
    
    // Tentar primeiro SEM orderBy para ver se é problema de índice
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    
    console.log('Query executada. Documentos encontrados:', querySnapshot.docs.length);
    
    const clientes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Documento:', doc.id, '- nome:', data.nome);
      return {
        ...data,
        id: doc.id
      } as Cliente;
    });
    
    // Ordenar no cliente
    clientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    
    console.log('Total de clientes carregados:', clientes.length);
    return clientes;
  } catch (error: unknown) {
    console.error('=== ERRO AO CARREGAR CLIENTES ===');
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      // Verificar se é erro de permissão
      if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
        console.error('>>> ERRO DE PERMISSÃO - Verificar Firebase Rules <<<');
      }
      // Verificar se é erro de índice
      if (error.message.includes('index') || error.message.includes('failed-precondition')) {
        console.error('>>> ERRO DE ÍNDICE - Criar índice no Firebase Console <<<');
      }
    }
    return [];
  }
}

export async function createCliente(tenantId: string, cliente: Cliente): Promise<string> {
  console.log('=== CREATE CLIENTE FIRESTORE SERVICE ===');
  console.log('tenantId:', tenantId);
  console.log('cliente:', JSON.stringify(cliente, null, 2));
  
  if (!tenantId) {
    console.error('ERRO: tenantId está vazio!');
    throw new Error('tenantId é obrigatório');
  }
  
  try {
    const docRef = doc(getClientesCollection(tenantId));
    console.log('Documento criado com ID:', docRef.id);
    console.log('Caminho:', docRef.path);
    
    await setDoc(docRef, {
      ...cliente,
      id: docRef.id,
      tenantId,
      criadoEm: serverTimestamp()
    });
    
    console.log('Cliente salvo com sucesso no Firestore!');
    return docRef.id;
  } catch (error) {
    console.error('=== ERRO AO CRIAR CLIENTE ===');
    console.error('Erro:', error);
    throw error;
  }
}

export async function updateCliente(tenantId: string, clienteId: string, data: Partial<Cliente>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'clientes', clienteId);
  await updateDoc(docRef, data);
}

export async function deleteCliente(tenantId: string, clienteId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'clientes', clienteId);
  await deleteDoc(docRef);
}

// ========== NOTAS FISCAIS ==========
const getNotasFiscaisCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'notasFiscais');

export async function getNotasFiscais(tenantId: string): Promise<NotaFiscal[]> {
  const q = query(getNotasFiscaisCollection(tenantId), orderBy('dataEmissao', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataEmissao: data.dataEmissao?.toDate() || new Date(),
      dataEntradaSaida: data.dataEntradaSaida?.toDate()
    } as NotaFiscal;
  });
}

export async function createNotaFiscal(tenantId: string, nota: NotaFiscal): Promise<string> {
  const docRef = doc(getNotasFiscaisCollection(tenantId));
  await setDoc(docRef, {
    ...nota,
    id: docRef.id,
    tenantId,
    dataEmissao: Timestamp.fromDate(nota.dataEmissao),
    dataEntradaSaida: nota.dataEntradaSaida ? Timestamp.fromDate(nota.dataEntradaSaida) : null
  });
  return docRef.id;
}

export async function getNotaFiscal(tenantId: string, notaId: string): Promise<NotaFiscal | null> {
  const docRef = doc(db, 'tenants', tenantId, 'notasFiscais', notaId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataEmissao: data.dataEmissao?.toDate() || new Date(),
      dataEntradaSaida: data.dataEntradaSaida?.toDate()
    } as NotaFiscal;
  }
  return null;
}

export async function deleteNotaFiscal(tenantId: string, notaId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'notasFiscais', notaId);
  await deleteDoc(docRef);
}

export async function subscribeNotasFiscais(tenantId: string, callback: (notas: NotaFiscal[]) => void): Promise<Unsubscribe> {
  const q = query(getNotasFiscaisCollection(tenantId), orderBy('dataEmissao', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const notas = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dataEmissao: data.dataEmissao?.toDate() || new Date(),
        dataEntradaSaida: data.dataEntradaSaida?.toDate()
      } as NotaFiscal;
    });
    callback(notas);
  }, (error) => {
    console.error('Erro no listener de notas fiscais:', error);
  });
}

// ========== ORDENS DE SERVIÇO ==========
const getOrdensServicoCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'ordensServico');

export async function getOrdensServico(tenantId: string): Promise<OrdemServico[]> {
  const q = query(getOrdensServicoCollection(tenantId), orderBy('dataAbertura', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataAbertura: data.dataAbertura?.toDate() || new Date(),
      dataPrevisao: data.dataPrevisao?.toDate(),
      dataConclusao: data.dataConclusao?.toDate()
    } as OrdemServico;
  });
}

// ========== TENANTS (Admin) ==========
export async function getAllTenants(): Promise<Tenant[]> {
  const tenantsCollection = collection(db, 'tenants');
  const q = query(tenantsCollection, orderBy('dataCriacao', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataExpiracao: data.dataExpiracao?.toDate() || new Date()
    } as Tenant;
  });
}

export async function updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId);
  await updateDoc(docRef, { status });
}

// ========== FUNCIONÁRIOS ==========
const getFuncionariosCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'funcionarios');

export async function getFuncionarios(tenantId: string): Promise<Funcionario[]> {
  const q = query(getFuncionariosCollection(tenantId), orderBy('nome'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
      dataAdmissao: data.dataAdmissao?.toDate(),
      dataNascimento: data.dataNascimento?.toDate(),
      ultimoAcesso: data.ultimoAcesso?.toDate()
    } as Funcionario;
  });
}

export async function getFuncionario(tenantId: string, funcionarioId: string): Promise<Funcionario | null> {
  const docRef = doc(db, 'tenants', tenantId, 'funcionarios', funcionarioId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
      dataAdmissao: data.dataAdmissao?.toDate(),
      dataNascimento: data.dataNascimento?.toDate(),
      ultimoAcesso: data.ultimoAcesso?.toDate()
    } as Funcionario;
  }
  return null;
}

export async function createFuncionario(tenantId: string, funcionario: Funcionario): Promise<void> {
  const docRef = doc(getFuncionariosCollection(tenantId));
  
  // Filtrar valores undefined antes de salvar
  const filteredData = Object.fromEntries(
    Object.entries(funcionario).filter(([_, value]) => value !== undefined)
  );
  
  const dataToSave: Record<string, unknown> = {
    ...filteredData,
    id: docRef.id,
    tenantId,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp()
  };
  
  // Converter datas
  if (funcionario.dataAdmissao) {
    dataToSave.dataAdmissao = Timestamp.fromDate(funcionario.dataAdmissao);
  }
  if (funcionario.dataNascimento) {
    dataToSave.dataNascimento = Timestamp.fromDate(funcionario.dataNascimento);
  }
  
  await setDoc(docRef, dataToSave);
}

export async function updateFuncionario(tenantId: string, funcionarioId: string, data: Partial<Funcionario>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'funcionarios', funcionarioId);
  
  // Filtrar valores undefined antes de salvar
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );
  
  const updateData: Record<string, unknown> = {
    ...filteredData,
    dataAtualizacao: serverTimestamp()
  };
  
  // Converter datas
  if (data.dataAdmissao) {
    updateData.dataAdmissao = Timestamp.fromDate(data.dataAdmissao);
  }
  if (data.dataNascimento) {
    updateData.dataNascimento = Timestamp.fromDate(data.dataNascimento);
  }
  if (data.ultimoAcesso) {
    updateData.ultimoAcesso = Timestamp.fromDate(data.ultimoAcesso);
  }
  
  await updateDoc(docRef, updateData);
}

export async function deleteFuncionario(tenantId: string, funcionarioId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'funcionarios', funcionarioId);
  await deleteDoc(docRef);
}

export async function getFuncionarioByEmail(tenantId: string, email: string): Promise<Funcionario | null> {
  const q = query(
    getFuncionariosCollection(tenantId),
    where('email', '==', email.toLowerCase()),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
      dataAdmissao: data.dataAdmissao?.toDate(),
      dataNascimento: data.dataNascimento?.toDate(),
      ultimoAcesso: data.ultimoAcesso?.toDate()
    } as Funcionario;
  }
  return null;
}

// ========== REAL-TIME LISTENERS ==========

// Listener em tempo real para funcionários
export function subscribeFuncionarios(
  tenantId: string, 
  callback: (funcionarios: Funcionario[]) => void
): Unsubscribe {
  const q = query(getFuncionariosCollection(tenantId), orderBy('nome'));
  
  return onSnapshot(q, (querySnapshot) => {
    const funcionarios = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dataCriacao: data.dataCriacao?.toDate() || new Date(),
        dataAtualizacao: data.dataAtualizacao?.toDate() || new Date(),
        dataAdmissao: data.dataAdmissao?.toDate(),
        dataNascimento: data.dataNascimento?.toDate(),
        ultimoAcesso: data.ultimoAcesso?.toDate()
      } as Funcionario;
    });
    callback(funcionarios);
  }, (error) => {
    console.error('Erro no listener de funcionários:', error);
  });
}

// Listener em tempo real para produtos
export function subscribeProdutos(
  tenantId: string,
  callback: (produtos: Produto[]) => void
): Unsubscribe {
  const q = query(getProdutosCollection(tenantId), orderBy('nome'));
  
  return onSnapshot(q, (querySnapshot) => {
    const produtos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dataCriacao: data.dataCriacao?.toDate() || new Date(),
        dataAtualizacao: data.dataAtualizacao?.toDate() || new Date()
      } as Produto;
    });
    callback(produtos);
  }, (error) => {
    console.error('Erro no listener de produtos:', error);
  });
}

// Listener em tempo real para categorias
export function subscribeCategorias(
  tenantId: string,
  callback: (categorias: Categoria[]) => void
): Unsubscribe {
  const q = query(getCategoriasCollection(tenantId), orderBy('nome'));
  
  return onSnapshot(q, (querySnapshot) => {
    const categorias = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Categoria));
    callback(categorias);
  }, (error) => {
    console.error('Erro no listener de categorias:', error);
  });
}

// Listener em tempo real para vendas
export function subscribeVendas(
  tenantId: string,
  callback: (vendas: Venda[]) => void
): Unsubscribe {
  const q = query(getVendasCollection(tenantId), orderBy('dataVenda', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const vendas = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dataVenda: data.dataVenda?.toDate() || new Date()
      } as Venda;
    });
    callback(vendas);
  }, (error) => {
    console.error('Erro no listener de vendas:', error);
  });
}

// Listener em tempo real para clientes
export function subscribeClientes(
  tenantId: string,
  callback: (clientes: Cliente[]) => void
): Unsubscribe {
  const q = query(getClientesCollection(tenantId), orderBy('nome'));
  
  return onSnapshot(q, (querySnapshot) => {
    const clientes = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Cliente));
    callback(clientes);
  }, (error) => {
    console.error('Erro no listener de clientes:', error);
  });
}

// ========== FORNECEDORES ==========
const getFornecedoresCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'fornecedores');

export async function getFornecedores(tenantId: string): Promise<Fornecedor[]> {
  const q = query(getFornecedoresCollection(tenantId), orderBy('nome'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate()
    } as Fornecedor;
  });
}

export async function getFornecedor(tenantId: string, fornecedorId: string): Promise<Fornecedor | null> {
  const docRef = doc(db, 'tenants', tenantId, 'fornecedores', fornecedorId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate()
    } as Fornecedor;
  }
  return null;
}

export async function getFornecedorByCNPJ(tenantId: string, cnpj: string): Promise<Fornecedor | null> {
  const q = query(
    getFornecedoresCollection(tenantId),
    where('cnpj', '==', cnpj),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dataCriacao: data.dataCriacao?.toDate() || new Date(),
      dataAtualizacao: data.dataAtualizacao?.toDate()
    } as Fornecedor;
  }
  return null;
}

export async function createFornecedor(tenantId: string, fornecedor: Fornecedor): Promise<string> {
  const docRef = doc(getFornecedoresCollection(tenantId));
  const cleanData = removeUndefinedFields({
    ...fornecedor,
    id: docRef.id,
    tenantId,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp()
  });
  await setDoc(docRef, cleanData);
  return docRef.id;
}

export async function updateFornecedor(tenantId: string, fornecedorId: string, data: Partial<Fornecedor>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'fornecedores', fornecedorId);
  const cleanData = removeUndefinedFields({
    ...data,
    dataAtualizacao: serverTimestamp()
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteFornecedor(tenantId: string, fornecedorId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'fornecedores', fornecedorId);
  await deleteDoc(docRef);
}

export function subscribeFornecedores(
  tenantId: string,
  callback: (fornecedores: Fornecedor[]) => void
): Unsubscribe {
  const q = query(getFornecedoresCollection(tenantId), orderBy('nome'));
  
  return onSnapshot(q, (querySnapshot) => {
    const fornecedores = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dataCriacao: data.dataCriacao?.toDate() || new Date(),
        dataAtualizacao: data.dataAtualizacao?.toDate()
      } as Fornecedor;
    });
    callback(fornecedores);
  }, (error) => {
    console.error('Erro no listener de fornecedores:', error);
  });
}

// ========== UNIDADES DE MEDIDA ==========
const getUnidadesMedidaCollection = (tenantId: string) => 
  collection(db, 'tenants', tenantId, 'unidadesMedida');

export async function getUnidadesMedida(tenantId: string): Promise<UnidadeMedida[]> {
  const q = query(getUnidadesMedidaCollection(tenantId), orderBy('sigla'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as UnidadeMedida));
}

export async function createUnidadeMedida(tenantId: string, unidade: UnidadeMedida): Promise<string> {
  const docRef = doc(getUnidadesMedidaCollection(tenantId));
  await setDoc(docRef, {
    ...unidade,
    id: docRef.id,
    tenantId
  });
  return docRef.id;
}

export async function updateUnidadeMedida(tenantId: string, unidadeId: string, data: Partial<UnidadeMedida>): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'unidadesMedida', unidadeId);
  await updateDoc(docRef, data);
}

export async function deleteUnidadeMedida(tenantId: string, unidadeId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'unidadesMedida', unidadeId);
  await deleteDoc(docRef);
}

export function subscribeUnidadesMedida(
  tenantId: string,
  callback: (unidades: UnidadeMedida[]) => void
): Unsubscribe {
  const q = query(getUnidadesMedidaCollection(tenantId), orderBy('sigla'));
  
  return onSnapshot(q, (querySnapshot) => {
    const unidades = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as UnidadeMedida));
    callback(unidades);
  }, (error) => {
    console.error('Erro no listener de unidades de medida:', error);
  });
}
