'use client';

import { addDoc, collection, getFirestore, onSnapshot, query, where, orderBy, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { app } from './config';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

const db = getFirestore(app);

// Defines the structure for a calculation, mirroring what was in the Zod schema.
export interface CalculationDB extends DocumentData {
  id: string;
  uid: string;
  date: string;
  createdAt: string;
  results: {
    grandTotalPrice: number;
    grandTotalPriceRiyal: number;
    totalNetWeight: number;
  };
  clientName: string;
  remainingCrates: number;
  remainingMoney: number;
  totalCrates: number;
  agreedAmount: number;
  agreedAmountCurrency: 'MAD' | 'Riyal';
}


export function saveCalculation(
  uid: string,
  calculationData: Omit<CalculationDB, 'id' | 'uid'>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const dataToSave = {
      ...calculationData,
      uid,
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
        reject(new Error("Impossible d'enregistrer sur le serveur."));
      });
  });
}

export function getCalculations(uid: string, onUpdate: (calculations: CalculationDB[]) => void): Unsubscribe {
    const q = query(
        collection(db, 'calculations'), 
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const calculations: CalculationDB[] = [];
        snapshot.forEach(doc => {
            calculations.push({ id: doc.id, ...doc.data() } as CalculationDB);
        });
        onUpdate(calculations);
    }, (error) => {
        console.error("Failed to fetch calculations in real-time:", error);
        const permissionError = new FirestorePermissionError({
            path: `calculations`,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return unsubscribe;
}
