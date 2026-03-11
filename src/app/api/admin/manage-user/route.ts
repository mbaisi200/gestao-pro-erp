import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp, hasAdminCredentials, getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, email, password, nome, idToken, action } = body;

    // Validar token do usuário
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    // Verificar se as credenciais estão configuradas
    if (!hasAdminCredentials()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin não configurado',
        details: `Para gerenciar usuários, configure as credenciais do Firebase Admin SDK:

1. Acesse o Firebase Console (https://console.firebase.google.com)
2. Selecione o projeto
3. Vá em Configurações > Contas de serviço
4. Clique em "Gerar nova chave privada"
5. Configure as variáveis de ambiente:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY`
      }, { status: 500 });
    }

    // Inicializar Firebase Admin
    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao inicializar Firebase Admin. Verifique as credenciais no .env',
      }, { status: 500 });
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Verificar token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[API] Erro ao verificar token:', error);
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
        console.log('[API] Usuário existente encontrado:', userRecord.uid);

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

      } catch (error) {
        // Usuário não existe - criar novo
        console.log('[API] Usuário não existe, criando novo...');
        try {
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
        } catch (createError) {
          console.error('[API] Erro ao criar usuário:', createError);
          return NextResponse.json({
            success: false,
            error: `Erro ao criar usuário: ${createError instanceof Error ? createError.message : 'Erro desconhecido'}`,
          }, { status: 500 });
        }
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
