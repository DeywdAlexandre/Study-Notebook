import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// #################################################################
// ### IMPORTANTE: COLE AQUI AS SUAS CREDENCIAIS REAIS DO FIREBASE ###
// #################################################################
// 1. Vá a console.firebase.google.com e crie um novo projeto.
// 2. Nas configurações do projeto, adicione uma nova aplicação web.
// 3. O Firebase vai fornecer um objeto `firebaseConfig`. Copie e cole-o aqui.
// 4. Ative 'Authentication' (com Google e Email/Password) e 'Firestore Database' na consola.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBPUm26yOPMT7rAjytTcQz9HcDADhDjzlQ",
  authDomain: "pokerace-ae503.firebaseapp.com",
  projectId: "pokerace-ae503",
  storageBucket: "pokerace-ae503.firebasestorage.app",
  messagingSenderId: "944381233813",
  appId: "1:944381233813:web:c6af760fb1a0ea464da99c",
  measurementId: "G-HNCN8CH4H2"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseError: string | null = null;

try {
  // Verifica se as credenciais são placeholders
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    throw new Error("Configuração do Firebase em falta. Por favor, adicione as suas credenciais em 'services/firebase.ts'.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e: any) {
  console.error("Falha na inicialização do Firebase:", e);
  firebaseError = `Falha na inicialização do Firebase: ${e.message}. Verifique as suas credenciais em services/firebase.ts.`;
}

export { auth, db, googleProvider, firebaseError };