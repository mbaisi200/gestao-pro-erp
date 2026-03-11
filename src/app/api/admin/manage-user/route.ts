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

  console.warn('Firebase Admin credentials not configured.');
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, email, password, nome, idToken, action } = body;

    // Validar token do usuário
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    // Inicializar Firebase Admin
    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin não configurado. Configure as credenciais no .env para gerenciar usuários.',
      }, { status: 500 });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Verificar token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se é admin master
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const isMasterAdmin = userData?.role === 'admin' && userData?.tenantId === 'admin-master';

    if (!isMasterAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    // Ação: Criar ou atualizar usuário
    if (action === 'create-user' || action === 'update-user') {
      if (!email || !password || !tenantId || !nome) {
        return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
      }

      // Verificar se já existe usuário com este email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);

        // Usuário existe - atualizar senha
        await auth.updateUser(userRecord.uid, {
          password: password,
          displayName: nome,
        });

        // Atualizar documento no Firestore
        await db.collection('users').doc(userRecord.uid).set({
          email,
          nome,
          role: 'admin',
          tenantId,
          ativo: true,
          atualizadoEm: new Date(),
        }, { merge: true });

        return NextResponse.json({
          success: true,
          message: 'Senha atualizada com sucesso!',
          uid: userRecord.uid,
        });

      } catch {
        // Usuário não existe - criar novo
        userRecord = await auth.createUser({
          email,
          password,
          displayName: nome,
          emailVerified: true,
        });

        // Criar documento no Firestore
        await db.collection('users').doc(userRecord.uid).set({
          email,
          nome,
          role: 'admin',
          tenantId,
          ativo: true,
          criadoEm: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Usuário criado com sucesso!',
          uid: userRecord.uid,
        });
      }
    }

    // Ação: Verificar se usuário existe
    if (action === 'check-user') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email não fornecido' }, { status: 400 });
      }

      try {
        const userRecord = await auth.getUserByEmail(email);
        return NextResponse.json({
          success: true,
          exists: true,
          uid: userRecord.uid,
          displayName: userRecord.displayName,
        });
      } catch {
        return NextResponse.json({
          success: true,
          exists: false,
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('[API] Erro ao gerenciar usuário:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    }, { status: 500 });
  }
}
