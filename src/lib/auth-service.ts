import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  role: 'admin' | 'gerente' | 'vendedor' | 'financeiro';
  tenantId: string;
  ativo: boolean;
  criadoEm: Date;
}

/**
 * Busca perfil do usuário no Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid: data.uid || uid,
        email: data.email || '',
        nome: data.nome || 'Usuário',
        role: data.role || 'vendedor',
        tenantId: data.tenantId || '',
        ativo: data.ativo !== false,
        criadoEm: data.criadoEm?.toDate() || new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

/**
 * Busca dados do tenant no Firestore
 */
export async function getTenantData(tenantId: string) {
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantSnap = await getDoc(tenantRef);
    
    if (tenantSnap.exists()) {
      return tenantSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    return null;
  }
}

/**
 * Cria um novo tenant no Firestore
 */
async function createTenant(tenantId: string, email: string): Promise<void> {
  const tenantRef = doc(db, 'tenants', tenantId);
  
  await setDoc(tenantRef, {
    id: tenantId,
    nome: 'Minha Empresa',
    cnpj: '',
    email: email,
    telefone: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    plano: 'basico',
    status: 'ativo',
    dataCriacao: serverTimestamp(),
    dataExpiracao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
    configuracoes: {
      corTema: '#2563eb',
      logoUrl: '',
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      nfSerie: 1,
      nfNumeroAtual: 1000
    }
  });
  
  console.log('Tenant criado:', tenantId);
}

/**
 * Busca tenant existente pelo email
 */
async function findTenantByEmail(email: string): Promise<string | null> {
  try {
    const { query: firestoreQuery, where: firestoreWhere, getDocs, collection } = await import('firebase/firestore');
    const tenantsRef = collection(db, 'tenants');
    const q = firestoreQuery(tenantsRef, firestoreWhere('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const tenantDoc = querySnapshot.docs[0];
      console.log('Tenant existente encontrado para email:', email, '- TenantId:', tenantDoc.id);
      return tenantDoc.id;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar tenant por email:', error);
    return null;
  }
}

/**
 * Cria perfil do usuário se não existir
 */
export async function createUserProfileIfNotExists(user: FirebaseUser): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      let tenantId: string;

      // Verificar se já existe um tenant com este email (para recuperar dados após recriação de conta)
      const existingTenantId = await findTenantByEmail(user.email || '');

      if (existingTenantId) {
        // Reutilizar tenant existente
        tenantId = existingTenantId;
        console.log('Reutilizando tenant existente:', tenantId);
      } else {
        // Gerar novo tenantId baseado no UID
        tenantId = `tenant-${user.uid}`;
        // Criar tenant
        await createTenant(tenantId, user.email || '');
        console.log('Novo tenant criado:', tenantId);
      }

      // Criar perfil do usuário
      const newProfile = {
        uid: user.uid,
        email: user.email || '',
        nome: user.displayName || 'Novo Usuário',
        role: 'admin' as const, // Primeiro usuário é admin
        tenantId: tenantId,
        ativo: true,
        criadoEm: serverTimestamp()
      };

      await setDoc(userRef, newProfile);
      console.log('Novo perfil criado para:', user.email, '- TenantId:', tenantId);

      return {
        ...newProfile,
        criadoEm: new Date()
      };
    }

    return userSnap.data() as UserProfile;
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return null;
  }
}

/**
 * Login com Firebase Auth REAL
 */
export async function loginWithEmail(email: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile } | null> {
  // Verificar se está no navegador
  if (typeof window === 'undefined') {
    throw new Error('Login só pode ser feito no navegador');
  }

  // Verificar se o auth está disponível
  if (!auth) {
    console.error('Firebase Auth não está inicializado');
    throw new Error('Erro de configuração: Firebase Auth não disponível');
  }

  console.log('=== INICIANDO LOGIN ===');
  console.log('Email:', email);
  console.log('Auth instance:', auth?.app?.name || 'undefined');
  console.log('Auth currentUser:', auth?.currentUser?.email || 'none');

  try {
    // Limpar espaços em branco
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    console.log('Tentando signInWithEmailAndPassword...');
    
    // Usar Firebase Auth real
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    const firebaseUser = userCredential.user;
    
    console.log('=== LOGIN FIREBASE BEM-SUCEDIDO ===');
    console.log('UID:', firebaseUser.uid);
    console.log('Email:', firebaseUser.email);
    console.log('Email Verified:', firebaseUser.emailVerified);
    
    // Buscar ou criar perfil no Firestore
    let profile = await getUserProfile(firebaseUser.uid);
    
    if (!profile) {
      console.log('Perfil não encontrado no Firestore, criando novo...');
      profile = await createUserProfileIfNotExists(firebaseUser);
    }
    
    if (!profile) {
      console.error('Não foi possível obter/criar perfil para:', email);
      throw new Error('Erro ao carregar perfil do usuário');
    }
    
    console.log('=== PERFIL ENCONTRADO ===');
    console.log('Profile:', JSON.stringify(profile, null, 2));
    
    // Verificar se usuário está ativo
    if (!profile.ativo) {
      console.log('Usuário inativo:', email);
      throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }
    
    return { user: firebaseUser, profile };
  } catch (error: unknown) {
    console.error('=== ERRO NO LOGIN ===');
    
    const authError = error as AuthError;
    console.error('Código do erro:', authError.code);
    console.error('Mensagem:', authError.message);
    
    // Traduzir erros comuns do Firebase
    let errorMessage = 'Erro ao fazer login';
    
    switch (authError.code) {
      case 'auth/user-not-found':
        errorMessage = 'Usuário não encontrado. Verifique o email digitado.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Senha incorreta. Tente novamente.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido. Verifique o formato do email.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
        break;
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta conta foi desativada. Entre em contato com o administrador.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erro de conexão. Verifique sua internet.';
        break;
      case 'auth/internal-error':
        errorMessage = 'Erro interno. Tente novamente.';
        break;
      default:
        // Se não é um erro do Firebase Auth, pode ser um erro personalizado
        if (error instanceof Error && error.message) {
          errorMessage = error.message;
        }
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Logout
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('Logout realizado');
  } catch (error) {
    console.error('Erro no logout:', error);
  }
}

/**
 * Observa mudanças no estado de autenticação
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
