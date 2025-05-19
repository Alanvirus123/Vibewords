// 'use server'
'use server';

/**
 * @fileOverview A flow to refine caption suggestions using Genkit.
 *
 * This file exports:
 * - `refineCaptionSuggestions`: An async function that refines caption suggestions based on user input.
 * - `RefineCaptionSuggestionsInput`: The input type for the `refineCaptionSuggestions` function.
 * - `RefineCaptionSuggestionsOutput`: The output type for the `refineCaptionSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineCaptionSuggestions function.
const RefineCaptionSuggestionsInputSchema = z.object({
  imageDescription: z
    .string()
    .describe('A description of the image for which captions are being refined.'),
  initialCaptions: z
    .array(z.string())
    .describe('The initial set of caption suggestions to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions.'),
});

export type RefineCaptionSuggestionsInput = z.infer<
  typeof RefineCaptionSuggestionsInputSchema
>;

// Define the output schema for the refineCaptionSuggestions function.
const RefineCaptionSuggestionsOutputSchema = z.object({
  refinedCaptions: z
    .array(z.string())
    .describe('The refined set of caption suggestions.'),
});

export type RefineCaptionSuggestionsOutput = z.infer<
  typeof RefineCaptionSuggestionsOutputSchema
>;

// Define the refineCaptionSuggestions function.
export async function refineCaptionSuggestions(
  input: RefineCaptionSuggestionsInput
): Promise<RefineCaptionSuggestionsOutput> {
  return refineCaptionSuggestionsFlow(input);
}

// Define the prompt for refining caption suggestions.
const refineCaptionSuggestionsPrompt = ai.definePrompt({
  name: 'refineCaptionSuggestionsPrompt',
  input: {schema: RefineCaptionSuggestionsInputSchema},
  output: {schema: RefineCaptionSuggestionsOutputSchema},
  prompt: `You are an expert caption writer. You will be provided with an image description, a list of initial caption suggestions, and user feedback on those captions.

  Your goal is to refine the initial captions based on the user feedback to create a new set of improved caption suggestions.

  Image Description: {{{imageDescription}}}

  Initial Captions:
  {{#each initialCaptions}}- {{{this}}}
  {{/each}}

  User Feedback: {{{userFeedback}}}

  Refined Captions:`,
});

// Define the Genkit flow for refining caption suggestions.
const refineCaptionSuggestionsFlow = ai.defineFlow(
  {
    name: 'refineCaptionSuggestionsFlow',
    inputSchema: RefineCaptionSuggestionsInputSchema,
    outputSchema: RefineCaptionSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await refineCaptionSuggestionsPrompt(input);
    return output!;
  }
);
