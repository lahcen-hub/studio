'use client';
import { useEffect } from 'react';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// This is a client-side component that listens for Firestore permission
// errors and throws them as an uncaught exception. This is useful for
// debugging security rules in the development environment.
//
// In Next.js, this will be caught by the error overlay and displayed
// to the developer.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: FirestorePermissionError) => {
      // In a production environment, you would want to log this error
      // to a service like Sentry or LogRocket.
      //
      // For the purpose of this example, we'll just throw it as an
      // uncaught exception.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        console.error(error);
      }
    };
    errorEmitter.on('permission-error', handler);
    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, []);
  return null;
}
