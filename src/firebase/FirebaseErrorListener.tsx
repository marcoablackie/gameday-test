'use client';

import { useEffect } from 'react';
import { errorEmitter } from './error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from './errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
      console.error('Firebase Permission Error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Cloud Sync Blocked',
        description: `Protocol denied: ${error.context.operation} at ${error.context.path}. Check your security rules.`,
      });
      
      // Throw the error to trigger the Next.js error overlay in development
      throw error;
    });
  }, [toast]);

  return null;
}
