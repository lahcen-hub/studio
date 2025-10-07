
'use server';

/**
 * @fileOverview A flow to save calculation data to Firestore.
 *
 * - saveCalculation - A function that handles saving the calculation data.
 * - CalculationInput - The input type for the saveCalculation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase/config';


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

const db = getFirestore(app);

const saveCalculationFlow = ai.defineFlow(
  {
    name: 'saveCalculationFlow',
    inputSchema: CalculationInputSchema,
    outputSchema: z.object({success: z.boolean(), docId: z.string().optional()}),
  },
  async (input) => {
    try {
      // Save to a more specific collection name 'cargoCalculations' for inter-app communication
      const docRef = await addDoc(collection(db, 'cargoCalculations'), {
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
