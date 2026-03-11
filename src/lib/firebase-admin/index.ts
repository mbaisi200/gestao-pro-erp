import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let cachedApp: App | null = null;

/**
 * Check if Firebase Admin credentials are configured
 */
export function hasAdminCredentials(): boolean {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return !!(clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY_HERE'));
}

/**
 * Initialize Firebase Admin if not already initialized
 */
export function getFirebaseAdminApp(): App | null {
  // Return cached app if available
  if (cachedApp) {
    return cachedApp;
  }

  // Check if already initialized
  if (getApps().length > 0) {
    cachedApp = getApps()[0];
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestao-pro-2e9ce';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Handle different formats of the private key
  if (privateKey) {
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  console.log('[Firebase Admin] Project ID:', projectId);
  console.log('[Firebase Admin] Client Email:', clientEmail ? 'Configurado' : 'Não configurado');
  console.log('[Firebase Admin] Private Key:', privateKey ? `${privateKey.substring(0, 50)}...` : 'Não configurado');

  if (clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
    try {
      console.log('[Firebase Admin] Inicializando com credenciais...');
      cachedApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Inicializado com sucesso!');
      return cachedApp;
    } catch (error) {
      console.error('[Firebase Admin] Erro ao inicializar:', error);
      return null;
    }
  }

  console.warn('[Firebase Admin] Credenciais não configuradas ou incompletas.');
  return null;
}

/**
 * Get Firebase Auth instance
 */
export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin não está inicializado');
  }
  return getAuth(app);
}

/**
 * Get Firebase Firestore instance
 */
export function getAdminFirestore() {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin não está inicializado');
  }
  return getFirestore(app);
}
