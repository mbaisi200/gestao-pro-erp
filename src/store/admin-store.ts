import { create } from 'zustand';
import { Tenant, PlanoPreco, TenantStatus } from '@/types';
import { mockTenantsAdmin, mockPlanos } from '@/lib/mock-data';

interface AdminState {
  tenants: Tenant[];
  planos: PlanoPreco[];
  tenantSelecionado: Tenant | null;
  abaAtiva: 'tenants' | 'planos' | 'metricas';
  
  // Actions
  setTenantSelecionado: (tenant: Tenant | null) => void;
  setAbaAtiva: (aba: 'tenants' | 'planos' | 'metricas') => void;
  adicionarTenant: (tenant: Tenant) => void;
  atualizarTenant: (id: string, tenant: Partial<Tenant>) => void;
  alterarStatusTenant: (id: string, status: TenantStatus) => void;
  bloquearTenantExpirado: (id: string) => void;
  
  // Computed
  getTenantsAtivos: () => Tenant[];
  getTenantsPorPlano: (plano: string) => Tenant[];
  getMetricas: () => {
    totalTenants: number;
    ativos: number;
    suspensos: number;
    expirados: number;
    receitaMensal: number;
    receitaAnual: number;
  };
}

export const useAdminStore = create<AdminState>((set, get) => ({
  tenants: mockTenantsAdmin,
  planos: mockPlanos,
  tenantSelecionado: null,
  abaAtiva: 'tenants',
  
  setTenantSelecionado: (tenant) => set({ tenantSelecionado: tenant }),
  
  setAbaAtiva: (abaAtiva) => set({ abaAtiva }),
  
  adicionarTenant: (tenant) => {
    set((state) => ({
      tenants: [...state.tenants, tenant]
    }));
  },
  
  atualizarTenant: (id, tenantData) => {
    set((state) => ({
      tenants: state.tenants.map(t =>
        t.id === id ? { ...t, ...tenantData } : t
      )
    }));
  },
  
  alterarStatusTenant: (id, status) => {
    set((state) => ({
      tenants: state.tenants.map(t =>
        t.id === id ? { ...t, status } : t
      )
    }));
  },
  
  bloquearTenantExpirado: (id) => {
    set((state) => ({
      tenants: state.tenants.map(t =>
        t.id === id ? { ...t, status: 'expirado' as TenantStatus } : t
      )
    }));
  },
  
  getTenantsAtivos: () => {
    const state = get();
    return state.tenants.filter(t => t.status === 'ativo');
  },
  
  getTenantsPorPlano: (plano) => {
    const state = get();
    return state.tenants.filter(t => t.plano === plano);
  },
  
  getMetricas: () => {
    const state = get();
    const ativos = state.tenants.filter(t => t.status === 'ativo');
    
    const receitaMensal = ativos.reduce((acc, t) => {
      const plano = state.planos.find(p => p.id === `plano-${t.plano === 'basico' ? '001' : t.plano === 'profissional' ? '002' : '003'}`);
      return acc + (plano?.precoMensal || 0);
    }, 0);
    
    return {
      totalTenants: state.tenants.length,
      ativos: ativos.length,
      suspensos: state.tenants.filter(t => t.status === 'suspenso').length,
      expirados: state.tenants.filter(t => t.status === 'expirado').length,
      receitaMensal,
      receitaAnual: receitaMensal * 12
    };
  }
}));
