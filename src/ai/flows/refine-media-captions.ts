
// 'use server';
'use server';

/**
 * @fileOverview A flow to refine media (image/video) caption suggestions using Genkit.
 * This flow now handles captions in multiple user-specified languages, producing four refined captions per language,
 * and expects/returns data as arrays of language-specific entries.
 *
 * This file exports:
 * - `refineMediaCaptions`: An async function that refines caption suggestions based on user input.
 * - `RefineMediaCaptionsInput`: The input type for the `refineMediaCaptions` function.
 * - `RefineMediaCaptionsOutput`: The output type for the `refineMediaCaptions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineMediaCaptions function.
const InitialCaptionEntrySchema = z.object({
  language: z.string().describe("The language of these initial captions."),
  captions: z.array(z.string().min(1))
    .length(4)
    .describe("The initial four captions for this language to refine.")
});

const RefineMediaCaptionsInputSchema = z.object({
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media (image or video). If available, this might be derived from initial English captions. The AI should primarily use the multi-language 'initialCaptions' for detailed context during refinement."
    ),
  initialCaptionEntries: z.array(InitialCaptionEntrySchema)
    .min(1)
    .describe('An array of objects, where each object contains the language and the initial four captions for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions (applies to all selected languages).'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine captions. This list should correspond to the languages present in initialCaptionEntries.'),
});

export type RefineMediaCaptionsInput = z.infer<
  typeof RefineMediaCaptionsInputSchema
>;

// Define the output schema for the refineMediaCaptions function.
const RefinedLanguageCaptionEntrySchema = z.object({
  language: z.string().describe("The name of the language for these refined captions."),
  refinedCaptions: z.array(z.string().min(1))
    .length(4)
    .describe("An array of four refined captions in this language.")
});

const RefineMediaCaptionsOutputSchema = z.object({
  refinedLanguageEntries: z.array(RefinedLanguageCaptionEntrySchema)
    .describe("An array of refined caption entries, one for each target language specified in the input."),
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
  prompt: `You are an expert caption writer. You will be provided with a media description, an array of initial caption entries (each for a specific language), user feedback, and a list of target languages.

  Your goal is to refine the initial captions for all specified target languages based on the user feedback. For each target language, create a new set of four improved caption suggestions.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description (general context): {{{mediaDescription}}}

  Initial Caption Entries (use these as primary context for refinement per language):
  {{#each initialCaptionEntries}}
  Language: {{this.language}}
    {{#each this.captions}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial captions provided.
  {{/each}}

  User Feedback (applies to all languages): {{{userFeedback}}}

  Return the refined captions as an array in the 'refinedLanguageEntries' field. Each element in this array should be an object corresponding to one of the target languages.
  Each object in the 'refinedLanguageEntries' array must contain:
  - A 'language' field: The name of the language (e.g., "English", "Spanish").
  - A 'refinedCaptions' field: An array of exactly four refined caption strings in that language.

  Example for 'refinedLanguageEntries' if targetLanguages were ["English", "Spanish"]:
  "refinedLanguageEntries": [
    {
      "language": "English",
      "refinedCaptions": ["Refined English Caption 1", "Refined English Caption 2", "Refined English Caption 3", "Refined English Caption 4"]
    },
    {
      "language": "Spanish",
      "refinedCaptions": ["Leyenda en Español Refinada 1", "Leyenda en Español Refinada 2", "Leyenda en Español Refinada 3", "Leyenda en Español Refinada 4"]
    }
  ]`,
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
