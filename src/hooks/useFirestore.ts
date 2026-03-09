'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth-store';

// Hook para gerenciar produtos
export function useProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuthStore();
  const empresaId = tenant?.id;

  const carregarDados = useCallback(() => {
    if (!user || !empresaId) {
      setProdutos([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'produtos'),
      where('empresaId', '==', empresaId),
      where('ativo', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
      }));
      setProdutos(data);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar produtos:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [empresaId, user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const load = async () => {
      unsubscribe = carregarDados();
    };
    
    load();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [carregarDados]);

  const adicionarProduto = async (dados: any) => {
    if (!empresaId) throw new Error('Empresa não definida');
    
    const produto = {
      ...dados,
      empresaId,
      estoqueAtual: dados.estoqueAtual || 0,
      ativo: true,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'produtos'), produto);
    return docRef.id;
  };

  const atualizarProduto = async (id: string, dados: any) => {
    await updateDoc(doc(db, 'produtos', id), {
      ...dados,
      atualizadoEm: Timestamp.now(),
    });
  };

  const excluirProduto = async (id: string) => {
    await updateDoc(doc(db, 'produtos', id), {
      ativo: false,
      atualizadoEm: Timestamp.now(),
    });
  };

  return { produtos, loading, adicionarProduto, atualizarProduto, excluirProduto };
}

// Hook para gerenciar categorias
export function useCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuthStore();
  const empresaId = tenant?.id;

  const carregarDados = useCallback(() => {
    if (!user || !empresaId) {
      setCategorias([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'categorias'),
      where('empresaId', '==', empresaId),
      where('ativo', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
      }));
      setCategorias(data.sort((a, b) => a.ordem - b.ordem));
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar categorias:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [empresaId, user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const load = async () => {
      unsubscribe = carregarDados();
    };
    
    load();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [carregarDados]);

  const adicionarCategoria = async (dados: any) => {
    if (!empresaId) throw new Error('Empresa não definida');
    
    const categoria = {
      ...dados,
      empresaId,
      ordem: dados.ordem || categorias.length + 1,
      ativo: true,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'categorias'), categoria);
    return docRef.id;
  };

  const atualizarCategoria = async (id: string, dados: any) => {
    await updateDoc(doc(db, 'categorias', id), {
      ...dados,
      atualizadoEm: Timestamp.now(),
    });
  };

  const excluirCategoria = async (id: string) => {
    await updateDoc(doc(db, 'categorias', id), {
      ativo: false,
      atualizadoEm: Timestamp.now(),
    });
  };

  return { categorias, loading, adicionarCategoria, atualizarCategoria, excluirCategoria };
}

// Hook para gerenciar vendas
export function useVendas() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuthStore();
  const empresaId = tenant?.id;

  const carregarDados = useCallback(() => {
    if (!user || !empresaId) {
      setVendas([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'vendas'),
      where('empresaId', '==', empresaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
      }));
      setVendas(data.sort((a, b) => b.criadoEm - a.criadoEm));
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar vendas:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [empresaId, user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const load = async () => {
      unsubscribe = carregarDados();
    };
    
    load();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [carregarDados]);

  return { vendas, loading };
}

// Hook para gerenciar contas a pagar e receber
export function useContas() {
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuthStore();
  const empresaId = tenant?.id;

  const carregarDados = useCallback(() => {
    if (!user || !empresaId) {
      setContas([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'contas'),
      where('empresaId', '==', empresaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        vencimento: doc.data().vencimento?.toDate(),
        dataPagamento: doc.data().dataPagamento?.toDate(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
      }));
      setContas(data.sort((a, b) => {
        if (!a.vencimento) return 1;
        if (!b.vencimento) return -1;
        return a.vencimento.getTime() - b.vencimento.getTime();
      }));
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar contas:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [empresaId, user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const load = async () => {
      unsubscribe = carregarDados();
    };
    
    load();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [carregarDados]);

  const adicionarConta = async (dados: any) => {
    if (!empresaId) throw new Error('Empresa não definida');
    
    const conta = {
      ...dados,
      empresaId,
      status: 'pendente',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'contas'), conta);
    return docRef.id;
  };

  const atualizarConta = async (id: string, dados: any) => {
    await updateDoc(doc(db, 'contas', id), {
      ...dados,
      atualizadoEm: Timestamp.now(),
    });
  };

  const registrarPagamento = async (id: string, dadosPagamento: { valor: number; formaPagamento: string; observacao?: string }) => {
    await updateDoc(doc(db, 'contas', id), {
      status: 'pago',
      dataPagamento: Timestamp.now(),
      valorPago: dadosPagamento.valor,
      formaPagamento: dadosPagamento.formaPagamento,
      observacaoPagamento: dadosPagamento.observacao,
      atualizadoEm: Timestamp.now(),
    });
  };

  const excluirConta = async (id: string) => {
    await deleteDoc(doc(db, 'contas', id));
  };

  // Calcular totais
  const contasPagar = contas.filter(c => c.tipo === 'pagar');
  const contasReceber = contas.filter(c => c.tipo === 'receber');
  
  const totalPagarPendente = contasPagar.filter(c => c.status === 'pendente').reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalReceberPendente = contasReceber.filter(c => c.status === 'pendente').reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalPago = contasPagar.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valorPago || 0), 0);
  const totalRecebido = contasReceber.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valorPago || 0), 0);

  return { 
    contas, 
    loading, 
    adicionarConta, 
    atualizarConta, 
    registrarPagamento, 
    excluirConta,
    contasPagar,
    contasReceber,
    totalPagarPendente,
    totalReceberPendente,
    totalPago,
    totalRecebido
  };
}
