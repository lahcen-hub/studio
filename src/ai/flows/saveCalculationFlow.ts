'use server';

/**
 * @fileOverview A flow to save calculation data to Firestore.
 *
 * - saveCalculation - A function that handles saving the calculation data.
 * - CalculationInput - The input type for the saveCalculation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore} from 'firebase-admin/firestore';
import {initializeApp, getApps, cert} from 'firebase-admin/app';

const CalculationInputSchema = z.object({
  uid: z.string().describe('User ID of the person saving the calculation'),
  date: z.string(),
  results: z.object({
    grandTotalPrice: z.number(),
    grandTotalPriceRiyal: z.number(),
  }),
  clientName: z.string(),
  remainingCrates: z.number(),
  remainingMoney: z.number(),
  totalCrates: z.number(),
});

export type CalculationInput = z.infer<typeof CalculationInputSchema>;

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    // You might want to use environment variables for service account credentials
  });
}

const db = getFirestore();

const saveCalculationFlow = ai.defineFlow(
  {
    name: 'saveCalculationFlow',
    inputSchema: CalculationInputSchema,
    outputSchema: z.object({success: z.boolean(), docId: z.string().optional()}),
  },
  async (input) => {
    try {
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