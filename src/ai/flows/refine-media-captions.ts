// 'use server';
'use server';

/**
 * @fileOverview A flow to refine media (image/video) caption suggestions using Genkit.
 *
 * This file exports:
 * - `refineMediaCaptions`: An async function that refines caption suggestions based on user input.
 * - `RefineMediaCaptionsInput`: The input type for the `refineMediaCaptions` function.
 * - `RefineMediaCaptionsOutput`: The output type for the `refineMediaCaptions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineMediaCaptions function.
const RefineMediaCaptionsInputSchema = z.object({
  mediaDescription: z
    .string()
    .describe('A description of the media (image or video) for which captions are being refined.'),
  initialCaptions: z
    .array(z.string())
    .describe('The initial set of caption suggestions to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions.'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
});

export type RefineMediaCaptionsInput = z.infer<
  typeof RefineMediaCaptionsInputSchema
>;

// Define the output schema for the refineMediaCaptions function.
const RefineMediaCaptionsOutputSchema = z.object({
  refinedCaptions: z
    .array(z.string())
    .describe('The refined set of caption suggestions.'),
});

export type RefineMediaCaptionsOutput = z.infer<
  typeof RefineMediaCaptionsOutputSchema
>;

// Define the refineMediaCaptions function.
export async function refineMediaCaptions(
  input: RefineMediaCaptionsInput
): Promise<RefineMediaCaptionsOutput> {
  return refineMediaCaptionsFlow(input);
}

// Define the prompt for refining caption suggestions.
const refineMediaCaptionsPrompt = ai.definePrompt({
  name: 'refineMediaCaptionsPrompt',
  input: {schema: RefineMediaCaptionsInputSchema},
  output: {schema: RefineMediaCaptionsOutputSchema},
  prompt: `You are an expert caption writer. You will be provided with a description of the {{#if mediaType}}{{mediaType}}{{else}}media{{/if}}, a list of initial caption suggestions, and user feedback on those captions.

  Your goal is to refine the initial captions based on the user feedback to create a new set of improved caption suggestions.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description: {{{mediaDescription}}}

  Initial Captions:
  {{#each initialCaptions}}- {{{this}}}
  {{/each}}

  User Feedback: {{{userFeedback}}}

  Refined Captions:`,
});

// Define the Genkit flow for refining caption suggestions.
const refineMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'refineMediaCaptionsFlow',
    inputSchema: RefineMediaCaptionsInputSchema,
    outputSchema: RefineMediaCaptionsOutputSchema,
  },
  async input => {
    const {output} = await refineMediaCaptionsPrompt(input);
    return output!;
  }
);
