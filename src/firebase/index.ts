
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services safely on the client.
 * Catches errors related to missing or invalid API keys to prevent app crashes.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth 
    };
  }

  try {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    let firestore: Firestore | null = null;
    let auth: Auth | null = null;

    // Individually initialize services to isolate failures
    // Only attempt if config is non-empty to avoid library internal crashes
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
      firestore = getFirestore(firebaseApp);
    }

    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
      try {
        auth = getAuth(firebaseApp);
      } catch (e) {
        console.error("Auth initialization failed.", e);
      }
    }

    return { 
      firebaseApp, 
      firestore: firestore as Firestore, 
      auth: auth as Auth 
    };
  } catch (error) {
    console.error("Firebase core initialization failed:", error);
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth 
    };
  }
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
