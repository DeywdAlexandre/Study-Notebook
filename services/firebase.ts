import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// As credenciais foram substituídas por placeholders seguros.
// O processo de deploy (GitHub Actions) irá substituir estes valores
// pelas chaves guardadas nos "Secrets" do seu repositório.
export const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "__FIREBASE_MEASUREMENT_ID__"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseError: string | null = null;

try {
  // Verifica se as credenciais são placeholders
  if (firebaseConfig.apiKey.startsWith("__")) {
    // No ambiente de desenvolvimento, isto pode falhar, mas o erro será informativo.
    // No processo de deploy, estes valores serão substituídos.
    throw new Error("Configuração do Firebase em falta. As credenciais devem ser fornecidas como 'secrets' do repositório para o deploy.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e: any) {
  console.error("Falha na inicialização do Firebase:", e);
  firebaseError = `Falha na inicialização do Firebase: ${e.message}. Verifique as suas credenciais em services/firebase.ts ou nos 'secrets' do repositório.`;
}

export { auth, db, googleProvider, firebaseError };