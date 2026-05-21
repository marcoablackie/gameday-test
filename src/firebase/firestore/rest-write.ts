'use client';

import { DocumentReference } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function toRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toRestValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, toRestValue(v)])
    )}};
  }
  return { stringValue: String(val) };
}

function buildFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split('.');
    let cur = fields;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = { mapValue: { fields: {} } };
      cur = cur[parts[i]].mapValue.fields;
    }
    cur[parts[parts.length - 1]] = toRestValue(value);
  }
  return fields;
}

async function restBase(ref: DocumentReference) {
  const auth = getAuth(ref.firestore.app);
  if (!auth.currentUser) throw new Error('No authenticated user');
  const token = await auth.currentUser.getIdToken();
  const projectId = (ref.firestore.app.options as any).projectId;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ref.path}`;
  return { token, url };
}

export async function updateDocViaRest(ref: DocumentReference, data: Record<string, any>): Promise<void> {
  const { token, url } = await restBase(ref);
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fetch(`${url}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: buildFields(data) }),
  });
  if (!res.ok) throw new Error(`REST updateDoc ${res.status}`);
}

export async function setDocViaRest(ref: DocumentReference, data: Record<string, any>): Promise<void> {
  const { token, url } = await restBase(ref);
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toRestValue(v);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`REST setDoc ${res.status}`);
}
