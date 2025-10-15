'use client';

import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as signOutFirebase,
  type User,
} from 'firebase/auth';
import { app } from './config';
import { useEffect, useState } from 'react';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

interface AuthState {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is signed in, now check for admin custom claim.
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
          const isAdmin = idTokenResult.claims.admin === true;
          setAuthState({ user: currentUser, isAdmin, loading: false });
        } catch (error) {
          console.error("Error getting user token or claims:", error);
          setAuthState({ user: currentUser, isAdmin: false, loading: false });
        }
      } else {
        // User is signed out.
        setAuthState({ user: null, isAdmin: false, loading: false });
      }
    });

    // Cleanup the listener on component unmount.
    return () => unsubscribe();
  }, []);

  return authState;
}

export function signInWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // User signed in.
      console.log('User signed in:', result.user);
    })
    .catch((error) => {
      // Handle different error cases
      if (error.code === 'auth/popup-closed-by-user') {
        // This is a common case, user intentionally closed the window.
        // We can log it for debugging but no need to show an error to the user.
        console.log('Google Sign-In popup closed by user.');
      } else if (error.code === 'auth/popup-blocked') {
        // This is often due to pop-ups being blocked, especially on mobile.
        alert('La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les pop-ups pour ce site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, this is not a critical error.
        console.log('Popup request cancelled.');
      }
      else {
        // For other errors, log them and show a generic message.
        console.error('Google Sign-In Error:', error);
        alert(`Erreur de connexion : ${error.message}`);
      }
    });
}

export function signOut() {
  signOutFirebase(auth).catch((error) => {
    console.error('Error signing out: ', error);
  });
}
