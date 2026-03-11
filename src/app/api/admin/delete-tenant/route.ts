import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Check if Firebase Admin credentials are configured
function hasAdminCredentials(): boolean {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return !!(clientEmail && privateKey && privateKey !== '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n');
}

// Initialize Firebase Admin if not already initialized
function getFirebaseAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestao-pro-2e9ce';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
    // Use service account credentials
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin with credentials:', error);
      return null;
    }
  }

  // No valid credentials available
  console.warn('Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env');
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, idToken } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'idToken é obrigatório' },
        { status: 401 }
      );
    }

    // Check if Firebase Admin credentials are configured
    if (!hasAdminCredentials()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Admin SDK não configurado',
          details: `Para excluir empresas, você precisa configurar as credenciais do Firebase Admin SDK no arquivo .env:

1. Acesse o Firebase Console (https://console.firebase.google.com)
2. Selecione o projeto "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestao-pro-2e9ce'}"
3. Vá em Configurações > Contas de serviço
4. Clique em "Gerar nova chave privada"
5. Salve o arquivo JSON e extraia os valores:
   - client_email -> FIREBASE_CLIENT_EMAIL
   - private_key -> FIREBASE_PRIVATE_KEY

Alternativamente, você pode atualizar as regras do Firestore para permitir exclusão:
- Acesse Firestore > Regras
- Cole o conteúdo do arquivo firestore.rules do projeto
- Publique as novas regras`
        },
        { status: 500 }
      );
    }

    // Initialize Firebase Admin
    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao inicializar Firebase Admin. Verifique as credenciais no .env',
        },
        { status: 500 }
      );
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // Get user profile to check if they are master admin
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isMasterAdmin = userData?.role === 'admin' && userData?.tenantId === 'admin-master';

    if (!isMasterAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores master podem excluir empresas.' },
        { status: 403 }
      );
    }

    // Prevent deleting the admin-master tenant
    if (tenantId === 'admin-master') {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir o tenant administrador master.' },
        { status: 400 }
      );
    }

    console.log(`[API] Iniciando exclusão do tenant: ${tenantId}`);

    // Get all subcollections
    const subcollections = [
      'produtos', 'categorias', 'contasPagar', 'contasReceber', 'vendas', 'pedidos',
      'clientes', 'notasFiscais', 'ordensServico', 'vendedores', 'fornecedores',
      'unidadesMedida', 'funcionarios', 'usuarios', 'estoque'
    ];

    // Delete all documents in subcollections
    for (const subcol of subcollections) {
      const colRef = db.collection('tenants').doc(tenantId).collection(subcol);
      const docs = await colRef.get();

      const batch = db.batch();
      docs.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      console.log(`[API] Subcoleção ${subcol} excluída: ${docs.size} documentos`);
    }

    // Delete the tenant document
    await db.collection('tenants').doc(tenantId).delete();
    console.log(`[API] Tenant ${tenantId} excluído com sucesso`);

    // Also delete users associated with this tenant
    const usersRef = db.collection('users').where('tenantId', '==', tenantId);
    const usersSnapshot = await usersRef.get();

    const userBatch = db.batch();
    usersSnapshot.docs.forEach(doc => userBatch.delete(doc.ref));
    await userBatch.commit();

    console.log(`[API] ${usersSnapshot.size} usuários associados excluídos`);

    return NextResponse.json({
      success: true,
      message: `Empresa ${tenantId} excluída com sucesso`,
      deletedUsers: usersSnapshot.size
    });

  } catch (error) {
    console.error('[API] Erro ao excluir tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: 'Verifique os logs do servidor para mais detalhes.'
      },
      { status: 500 }
    );
  }
}
