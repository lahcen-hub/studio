
'use server';

/**
 * @fileOverview A flow to save calculation data to Firestore and fetch calculations.
 *
 * - saveCalculation - A function that handles saving the calculation data.
 * - getCalculations - A function that fetches calculations for a user.
 * - CalculationInput - The input type for the saveCalculation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: credential.applicationDefault(),
    databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
  });
}

const CalculationInputSchema = z.object({
  uid: z.string().describe('User ID of the person saving the calculation'),
  date: z.string(),
  results: z.object({
    grandTotalPrice: z.number(),
    grandTotalPriceRiyal: z.number(),
    totalNetWeight: z.number(),
  }),
  clientName: z.string(),
  remainingCrates: z.number(),
  remainingMoney: z.number(),
  totalCrates: z.number(),
  agreedAmount: z.number(),
  agreedAmountCurrency: z.enum(['MAD', 'Riyal']),
});

export type CalculationInput = z.infer<typeof CalculationInputSchema>;

const CalculationDBSchema = CalculationInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

export type CalculationDB = z.infer<typeof CalculationDBSchema>;


const saveCalculationFlow = ai.defineFlow(
  {
    name: 'saveCalculationFlow',
    inputSchema: CalculationInputSchema,
    outputSchema: z.object({success: z.boolean(), docId: z.string().optional()}),
  },
  async (input) => {
    try {
      const db = getFirestore();
      const docRef = await db.collection('calculations').add({
        ...input,
        createdAt: new Date().toISOString(),
      });
      console.log('Document written with ID: ', docRef.id);
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error('Error adding document: ', error);
      return { success: false };
    }
  }
);

export async function saveCalculation(input: CalculationInput): Promise<{success: boolean, docId?: string}> {
    return saveCalculationFlow(input);
}


const getCalculationsFlow = ai.defineFlow({
    name: 'getCalculationsFlow',
    inputSchema: z.string(), // UID
    outputSchema: z.array(CalculationDBSchema)
}, async (uid) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('calculations').where('uid', '==', uid).orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return [];
        }
        const calculations: CalculationDB[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            calculations.push({
                id: doc.id,
                uid: data.uid,
                date: data.date,
                results: data.results,
                clientName: data.clientName,
                remainingCrates: data.remainingCrates,
                remainingMoney: data.remainingMoney,
                totalCrates: data.totalCrates,
                agreedAmount: data.agreedAmount,
                agreedAmountCurrency: data.agreedAmountCurrency,
                createdAt: data.createdAt,
            });
        });
        return calculations;
    } catch (error) {
        console.error('Error getting documents: ', error);
        return [];
    }
});

export async function getCalculations(uid: string): Promise<CalculationDB[]> {
    return getCalculationsFlow(uid);
}
