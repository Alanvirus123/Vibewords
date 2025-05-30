
'use server';

/**
 * @fileOverview A flow to refine song suggestions using Genkit.
 * Handles song suggestions in multiple user-specified languages.
 *
 * This file exports:
 * - `refineSongSuggestions`: An async function that refines song suggestions based on user input.
 * - `RefineSongSuggestionsInput`: The input type for the `refineSongSuggestions` function.
 * - `RefineSongSuggestionsOutput`: The output type for the `refineSongSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineSongSuggestions function.
const RefineSongSuggestionsInputSchema = z.object({
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media (image or video). If available, this might be derived from English captions or refined captions. The AI should primarily use the multi-language 'initialSongSuggestions' for detailed context during refinement."
    ),
  initialSongSuggestions: z.record(z.string(), z.array(z.string()).length(1))
    .describe('An object where each key is a language name and the value is an array of the initial one song suggestion for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial song suggestions (applies to all selected languages).'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine song suggestions.'),
});

export type RefineSongSuggestionsInput = z.infer<
  typeof RefineSongSuggestionsInputSchema
>;

// Define the output schema for the refineSongSuggestions function.
const RefineSongSuggestionsOutputSchema = z.object({
  refinedSongSuggestions: z.record(z.string(), z.array(z.string()).length(1))
    .describe('An object where each key is a language name (from targetLanguages) and the value is an array of one refined song title for that language.'),
});

export type RefineSongSuggestionsOutput = z.infer<
  typeof RefineSongSuggestionsOutputSchema
>;

// Define the refineSongSuggestions function.
export async function refineSongSuggestions(
  input: RefineSongSuggestionsInput
): Promise<RefineSongSuggestionsOutput> {
  return refineSongSuggestionsFlow(input);
}

// Define the prompt for refining song suggestions.
const refineSongSuggestionsPrompt = ai.definePrompt({
  name: 'refineSongSuggestionsPrompt',
  input: {schema: RefineSongSuggestionsInputSchema},
  output: {schema: RefineSongSuggestionsOutputSchema},
  prompt: `You are an expert music curator. You will be provided with a media description, initial song suggestions for multiple languages, user feedback, and a list of target languages.

  Your goal is to refine the initial song suggestions for all specified target languages based on the user feedback. For each target language, create a new set of one improved song suggestion.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description (general context): {{{mediaDescription}}}

  Initial Song Suggestions (use these as primary context for refinement per language):
  {{#each initialSongSuggestions}}
  Language: {{@key}}
    {{#each this}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial song suggestions provided.
  {{/each}}

  User Feedback on Songs (applies to all languages): {{{userFeedback}}}

  Return the refined song suggestions in the 'refinedSongSuggestions' field. This field should be an object where each key is one of the target language names (e.g., "English", "Spanish"), and the value for each key is an array containing exactly one refined song title string in that language.
  For example, if targetLanguages were ["English", "Spanish"]:
  "refinedSongSuggestions": {
    "English": ["Refined English Song Title"],
    "Spanish": ["Título de Canción Refinado en Español"]
  }`,
});

// Define the Genkit flow for refining song suggestions.
const refineSongSuggestionsFlow = ai.defineFlow(
  {
    name: 'refineSongSuggestionsFlow',
    inputSchema: RefineSongSuggestionsInputSchema,
    outputSchema: RefineSongSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await refineSongSuggestionsPrompt(input);
    return output!;
  }
);
