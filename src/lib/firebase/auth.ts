'use client';

import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as signOutFirebase,
  type User,
} from 'firebase/auth';
import {app} from './config';
import {useEffect, useState} from 'react';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to check for redirect results and set up the auth state listener.
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // User has just signed in via redirect.
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result: ", error);
      })
      .finally(() => {
        // Now, set up the listener for subsequent auth state changes.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false); // Set loading to false only after the listener is set up and initial state is known.
        });

        // Cleanup the listener on component unmount.
        return () => unsubscribe();
      });
  }, []);

  return {user, loading};
}

export function signInWithGoogle() {
  signInWithRedirect(auth, provider).catch((error) => {
    // This catch is for immediate errors, like misconfiguration.
    // The main result is handled by getRedirectResult in useAuth.
    console.error("Error initiating Google sign-in redirect: ", error);
  });
}

export function signOut() {
  signOutFirebase(auth).catch((error) => {
    console.error("Error signing out: ", error);
  });
}
