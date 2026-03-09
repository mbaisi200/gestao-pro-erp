import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAoL0VDbJRxEaFf-Dt4DqM3OsNbn9wU9TY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gestao-pro-2e9ce.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gestao-pro-2e9ce",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gestao-pro-2e9ce.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "15849441024",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:15849441024:web:0953b372e4e3e28e5cd5e5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6NHL0VDWT4"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get Auth instance
const auth = getAuth(app);

// Log para debug
if (typeof window !== 'undefined') {
  console.log('=== FIREBASE INIT ===');
  console.log('App name:', app.name);
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth domain:', firebaseConfig.authDomain);
  console.log('Current user:', auth.currentUser?.email || 'none');
}

export { auth };
export const db = getFirestore(app);
export default app;
