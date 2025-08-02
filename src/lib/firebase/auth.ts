'use client';

import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {user, loading};
}

export function signInWithGoogle() {
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Error signing in with Google: ", error);
  });
}

export function signOut() {
  signOutFirebase(auth).catch((error) => {
    console.error("Error signing out: ", error);
  });
}
