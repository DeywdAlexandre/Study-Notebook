
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

// #################################################################
// ### IMPORTANTE: SUBSTITUA PELAS SUAS CREDENCIAIS REAIS DO FIREBASE ###
// #################################################################
// A aplicação não funcionará com a sua base de dados sem as suas próprias chaves.
// Estes são valores de exemplo para permitir que a aplicação seja renderizada visualmente.
const firebaseConfig = {
  apiKey: "AIzaSyB..._examples_only_...j3s",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
};

let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseError: string | null = null;

try {
  // A Firebase lança um erro com config vazia, então verificamos primeiro.
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("..._examples_only_...")) {
      throw new Error("A configuração do Firebase parece ser um placeholder. Por favor, atualize-a com as suas credenciais reais.");
  }
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (e: any) {
  console.error("Falha na inicialização do Firebase:", e);
  firebaseError = `Falha na inicialização do Firebase: ${e.message}. Por favor, verifique a sua configuração em 'services/firebase.ts'.`;
}

export { auth, googleProvider, firebaseError };
