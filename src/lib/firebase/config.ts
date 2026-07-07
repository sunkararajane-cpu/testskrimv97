/// <reference types="vite/client" />

// firebase/config.ts
// Configuration for Firebase
// Users will provide these via standard .env logic. Note: The app uses 'set_up_firebase' tool to provision rules 
// and config dynamically in the actual application context, so this is a shell for the SDK structure.

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder"
};

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;
let messaging: ReturnType<typeof getMessaging> | undefined;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn("Firebase Messaging not supported/configured in this environment.");
  }
} catch (e) {
  console.warn("Firebase config not found or invalid. Skipping initialization in preview.", e);
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, messaging, googleProvider };
