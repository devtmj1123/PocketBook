import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Standardize configuration priority: Prefer environment variables (e.g. Vercel) over developer sandbox files
const envs = (import.meta as any).env || {};
const configData = firebaseConfig as any;

const activeConfig = {
  apiKey: envs.VITE_FIREBASE_API_KEY || configData.apiKey || "",
  authDomain: envs.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain || "",
  projectId: envs.VITE_FIREBASE_PROJECT_ID || configData.projectId || "",
  storageBucket: envs.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket || "",
  messagingSenderId: envs.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId || "",
  appId: envs.VITE_FIREBASE_APP_ID || configData.appId || "",
};

const activeDatabaseId = envs.VITE_FIREBASE_DATABASE_ID || configData.firestoreDatabaseId || "(default)";


// Initialize official Firebase App Client
const app = initializeApp(activeConfig);

// Critical: export db linked to proper databaseId
export const db = getFirestore(app, activeDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handles error reporting structure by converting it into a standardized JSON message.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Exception Raised: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
