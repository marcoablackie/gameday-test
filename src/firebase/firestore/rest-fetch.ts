'use client';

import { DocumentReference } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Fetches a Firestore document via the REST API, bypassing the SDK's
// online-state tracking which marks itself offline after a 10s timer.
export async function getDocViaRest<T>(ref: DocumentReference): Promise<T | null> {
  const auth = getAuth(ref.firestore.app);
  if (!auth.currentUser) throw new Error('No authenticated user');
  const token = await auth.currentUser.getIdToken();
  const projectId = (ref.firestore.app.options as any).projectId;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ref.path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
  return convertDoc(await res.json()) as T;
}

function convertDoc(doc: any): Record<string, any> {
  return Object.fromEntries(
    Object.entries(doc.fields ?? {}).map(([k, v]) => [k, convertValue(v)])
  );
}

function convertValue(val: any): any {
  const [type, v] = Object.entries(val)[0] as [string, any];
  switch (type) {
    case 'stringValue': return v;
    case 'integerValue': return Number(v);
    case 'doubleValue': return Number(v);
    case 'booleanValue': return v;
    case 'nullValue': return null;
    case 'arrayValue': return ((v as any).values ?? []).map(convertValue);
    case 'mapValue': return convertDoc(v);
    case 'timestampValue': return new Date(v as string);
    default: return v;
  }
}
