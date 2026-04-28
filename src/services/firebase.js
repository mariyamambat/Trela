import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

if (!firebaseEnv.apiKey) {
  console.error(
    "Missing VITE_FIREBASE_API_KEY in .env. Set your active Firebase Web API key to enable auth/data."
  );
}

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey || "MISSING_FIREBASE_API_KEY",
  authDomain: firebaseEnv.authDomain || "trela-5a7a3.firebaseapp.com",
  projectId: firebaseEnv.projectId || "trela-5a7a3",
  storageBucket: firebaseEnv.storageBucket || "trela-5a7a3.firebasestorage.app",
  messagingSenderId: firebaseEnv.messagingSenderId || "316733740604",
  appId: firebaseEnv.appId || "1:316733740604:web:e4a3a6ba83752bee9c9539",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);