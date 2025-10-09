
'use server';

/**
 * @fileOverview A flow to fetch calculations.
 *
 * - getCalculations - A function that fetches calculations for a user.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: credential.applicationDefault(),
      databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
    });
  } catch (e) {
    console.error("Firebase Admin SDK initialization failed:", e);
  }
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


const CalculationDBSchema = CalculationInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

export type CalculationDB = z.infer<typeof CalculationDBSchema>;


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
