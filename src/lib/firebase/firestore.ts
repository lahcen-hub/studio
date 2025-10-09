
'use client';

import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { app } from './config';
import type { CalculationDB } from '@/ai/flows/saveCalculationFlow';

const db = getFirestore(app);

export async function saveCalculation(
  uid: string,
  calculationData: Omit<CalculationDB, 'id' | 'uid' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'calculations'), {
      ...calculationData,
      uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw new Error("Impossible d'enregistrer sur le serveur.");
  }
}
