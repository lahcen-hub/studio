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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        // This handles the redirect result after coming back from Google sign-in
        getRedirectResult(auth)
          .then((result) => {
            if (result && result.user) {
              setUser(result.user);
            }
          })
          .catch((error) => {
            console.error("Error getting redirect result: ", error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  return {user, loading};
}

export function signInWithGoogle() {
  signInWithRedirect(auth, provider).catch((error) => {
    console.error("Error signing in with Google redirect: ", error);
  });
}

export function signOut() {
  signOutFirebase(auth).catch((error) => {
    console.error("Error signing out: ", error);
  });
}
