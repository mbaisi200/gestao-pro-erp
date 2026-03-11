import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant } from '@/types';
import { loginWithEmail, signOut, getUserProfile, UserProfile } from '@/lib/auth-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isTenantExpired } from '@/lib/admin-service';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  firebaseUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        console.log('=== AUTH STORE LOGIN ===');
        console.log('Email recebido:', email);
        console.log('Password length:', password?.length);

        try {
          const result = await loginWithEmail(email, password);

          if (!result) {
            console.error('Login retornou null');
            set({ 
              isLoading: false, 
              error: 'Email ou senha inválidos. Verifique suas credenciais.' 
            });
            return false;
          }

          const { profile } = result;

          console.log('=== LOGIN SUCESSO ===');
          console.log('Profile:', profile);

          // Buscar dados do tenant
          let tenant: Tenant | null = null;
          if (profile.tenantId) {
            try {
              const tenantRef = doc(db, 'tenants', profile.tenantId);
              const tenantSnap = await getDoc(tenantRef);

              if (tenantSnap.exists()) {
                const tenantData = tenantSnap.data();
                tenant = {
                  id: tenantData.id || profile.tenantId,
                  nome: tenantData.nome || 'Empresa',
                  cnpj: tenantData.cnpj || '',
                  email: tenantData.email || '',
                  telefone: tenantData.telefone || '',
                  endereco: tenantData.endereco || {},
                  plano: tenantData.plano || 'basico',
                  status: tenantData.status || 'ativo',
                  dataCriacao: tenantData.dataCriacao?.toDate() || new Date(),
                  dataExpiracao: tenantData.dataExpiracao?.toDate() || new Date(),
                  configuracoes: tenantData.configuracoes || {
                    corTema: '#2563eb',
                    logoUrl: '',
                    moeda: 'BRL',
                    timezone: 'America/Sao_Paulo',
                    nfSerie: 1,
                    nfNumeroAtual: 1000
                  }
                };
                console.log('Tenant encontrado:', tenant.nome);

                // Verificar se o tenant está expirado ou suspenso
                // Exceto para admin-master que tem acesso total
                if (profile.tenantId !== 'admin-master') {
                  const expired = tenantData.dataExpiracao && isTenantExpired(tenantData.dataExpiracao.toDate());

                  if (expired || tenant.status === 'expirado') {
                    console.log('Tenant expirado:', tenant.nome);
                    set({
                      isLoading: false,
                      error: 'Sua assinatura expirou. Entre em contato com o suporte para renovar.',
                      isAuthenticated: false,
                      user: null,
                      tenant: null,
                    });
                    return false;
                  }

                  if (tenant.status === 'suspenso') {
                    console.log('Tenant suspenso:', tenant.nome);
                    set({
                      isLoading: false,
                      error: 'Sua conta está suspensa. Entre em contato com o suporte.',
                      isAuthenticated: false,
                      user: null,
                      tenant: null,
                    });
                    return false;
                  }
                }
              } else {
                console.log('Tenant não encontrado para ID:', profile.tenantId);
                // Criar tenant básico se não existir
                tenant = {
                  id: profile.tenantId,
                  nome: 'Minha Empresa',
                  cnpj: '',
                  email: profile.email,
                  telefone: '',
                  endereco: {},
                  plano: 'basico',
                  status: 'ativo',
                  dataCriacao: new Date(),
                  dataExpiracao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  configuracoes: {
                    corTema: '#2563eb',
                    logoUrl: '',
                    moeda: 'BRL',
                    timezone: 'America/Sao_Paulo',
                    nfSerie: 1,
                    nfNumeroAtual: 1000
                  }
                };
              }
            } catch (err) {
              console.error('Erro ao buscar tenant:', err);
            }
          }

          // Criar objeto User
          const user: User = {
            id: profile.uid,
            email: profile.email,
            nome: profile.nome,
            role: profile.role,
            tenantId: profile.tenantId,
            ativo: profile.ativo,
            dataCriacao: profile.criadoEm
          };

          console.log('=== DEFININDO ESTADO ===');
          console.log('User:', user);
          console.log('Tenant:', tenant);

          set({
            user,
            tenant,
            firebaseUser: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('Login realizado com sucesso:', email);
          return true;
        } catch (error: any) {
          console.error('=== ERRO NO LOGIN (AUTH STORE) ===');
          console.error('Error object:', error);
          console.error('Error message:', error?.message);
          console.error('Error code:', error?.code);
          
          const errorMessage = error?.message || 'Erro ao fazer login. Tente novamente.';
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            tenant: null,
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('Erro no logout:', error);
        } finally {
          set({
            user: null,
            tenant: null,
            firebaseUser: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user) => {
        set({ user });
      },

      setTenant: (tenant) => {
        set({ tenant });
      },
    }),
    {
      name: 'gestao-pro-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        firebaseUser: state.firebaseUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
