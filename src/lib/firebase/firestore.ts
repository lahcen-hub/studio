'use client';

import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { app } from './config';
import type { CalculationDB } from '@/ai/flows/saveCalculationFlow';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

const db = getFirestore(app);

export function saveCalculation(
  uid: string,
  calculationData: Omit<CalculationDB, 'id' | 'uid' | 'createdAt'>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const dataToSave = {
      ...calculationData,
      uid,
      createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, 'calculations'), dataToSave)
      .then(docRef => {
        resolve(docRef.id);
      })
      .catch(async (serverError) => {
        console.error('Original Firestore error:', serverError);
        const permissionError = new FirestorePermissionError({
          path: `calculations`,
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        // We still reject the promise so the UI can know the save failed.
        reject(new Error("Impossible d'enregistrer sur le serveur."));
      });
  });
}
