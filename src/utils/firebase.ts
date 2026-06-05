import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if it is still the placeholder config
export const isFirebaseConfigured = (): boolean => {
  return firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY';
};

// Safe initialization
const app = (isFirebaseConfigured() && !getApps().length)
  ? initializeApp(firebaseConfig)
  : (getApps().length ? getApp() : null);

export const db = (app && isFirebaseConfigured())
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : null;

export const auth = (app && isFirebaseConfigured())
  ? getAuth(app)
  : null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation directive from SKILL.md
export async function testConnection() {
  if (!isFirebaseConfigured() || !db) {
    console.log("Firebase is not fully configured yet. Dynamic fallback mode activated.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();
