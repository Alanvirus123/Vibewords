
// 'use server';
'use server';

/**
 * @fileOverview A flow to refine media (image/video) caption suggestions using Genkit.
 * This flow now handles captions in multiple user-specified languages, producing four refined captions per language.
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
    .describe(
      "A general description of the media (image or video). If available, this might be derived from initial English captions. The AI should primarily use the multi-language 'initialCaptions' for detailed context during refinement."
    ),
  initialCaptions: z.record(z.string(), z.array(z.string()).length(4))
    .describe('An object where each key is a language name and the value is an array of the initial four captions for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions (applies to all selected languages).'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine captions.'),
});

export type RefineMediaCaptionsInput = z.infer<
  typeof RefineMediaCaptionsInputSchema
>;

// Define the output schema for the refineMediaCaptions function.
const RefineMediaCaptionsOutputSchema = z.object({
  refinedCaptions: z.record(z.string(), z.array(z.string().min(1)).length(4))
    .describe('An object where each key is a language name (from targetLanguages) and the value is an array of four refined captions for that language.'),
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
  prompt: `You are an expert caption writer. You will be provided with a media description, initial caption suggestions for multiple languages, user feedback, and a list of target languages.

  Your goal is to refine the initial captions for all specified target languages based on the user feedback. For each target language, create a new set of four improved caption suggestions.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description (general context): {{{mediaDescription}}}

  Initial Captions (use these as primary context for refinement per language):
  {{#each initialCaptions}}
  Language: {{@key}}
    {{#each this}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial captions provided.
  {{/each}}

  User Feedback (applies to all languages): {{{userFeedback}}}

  Return the refined captions in the 'refinedCaptions' field. This field should be an object where each key is one of the target language names (e.g., "English", "Spanish"), and the value for each key is an array containing exactly four refined caption strings in that language.
  Example for 'refinedCaptions' if targetLanguages were ["English", "Spanish"]:
  "refinedCaptions": {
    "English": ["Refined English Caption 1", "Refined English Caption 2", "Refined English Caption 3", "Refined English Caption 4"],
    "Spanish": ["Leyenda en Español Refinada 1", "Leyenda en Español Refinada 2", "Leyenda en Español Refinada 3", "Leyenda en Español Refinada 4"]
  }`,
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
