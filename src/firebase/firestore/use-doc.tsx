'use client';

import { useState, useEffect } from 'react';
import { DocumentReference, getDoc, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { getDocViaRest } from './rest-fetch';

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  const loading = ref !== null && ref.path !== loadedPath;

  useEffect(() => {
    if (!ref) {
      setData(null);
      setError(null);
      setLoadedPath(null);
      return;
    }

    let cancelled = false;

    // Race SDK and REST in parallel — eliminates the 10s SDK offline delay.
    // REST responds in ~1s regardless of SDK online state.
    Promise.any([
      getDoc(ref).then(s => s.exists() ? (s.data() as T) : null),
      getDocViaRest<T>(ref),
    ]).then((result) => {
      if (cancelled) return;
      setData(result);
      setError(null);
      setLoadedPath(ref.path);
    }).catch((err) => {
      if (cancelled) return;
      console.warn("Both getDoc and REST failed:", err);
      setError(err);
      setLoadedPath(ref.path);
    });

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (cancelled) return;
        // Skip empty from-cache snapshots — fires before server data arrives.
        if (!snapshot.exists() && snapshot.metadata.fromCache) return;
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setError(null);
        setLoadedPath(ref.path);
      },
      (err) => {
        if (cancelled) return;
        console.error("Firestore snapshot error:", err);
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }));
        }
        setError(err);
        setLoadedPath(ref.path);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [ref]);

  return { data, loading, error };
}
