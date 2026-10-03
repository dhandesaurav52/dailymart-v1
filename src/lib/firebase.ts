import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(config) : getApp();

export const auth = getAuth(app);

// Use named firestore database ID from configuration with robust auto-detect long-polling
const customDbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? config.firestoreDatabaseId
  : undefined;

let firestoreDb;
try {
  firestoreDb = customDbId
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, customDbId)
    : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  firestoreDb = customDbId
    ? getFirestore(app, customDbId)
    : getFirestore(app);
}

export const db = firestoreDb;

// Test Firestore connection gracefully without triggering blocking network errors
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const docRef = doc(db, 'shops', 'init');
    await getDoc(docRef);
    return true;
  } catch {
    return false;
  }
}
