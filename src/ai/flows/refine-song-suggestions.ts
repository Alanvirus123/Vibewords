
'use server';

/**
 * @fileOverview A flow to refine song suggestions using Genkit.
 * Handles song suggestions in multiple user-specified languages.
 * Expects/returns data as arrays of language-specific entries.
 *
 * This file exports:
 * - `refineSongSuggestions`: An async function that refines song suggestions based on user input.
 * - `RefineSongSuggestionsInput`: The input type for the `refineSongSuggestions` function.
 * - `RefineSongSuggestionsOutput`: The output type for the `refineSongSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineSongSuggestions function.
const InitialSongEntrySchema = z.object({
  language: z.string().describe("The language of this initial song suggestion."),
  songSuggestions: z.array(z.string().min(1))
    .length(1)
    .describe("The initial one song suggestion for this language to refine.")
});

const RefineSongSuggestionsInputSchema = z.object({
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media (image or video). If available, this might be derived from English captions or refined captions. The AI should primarily use the multi-language 'initialSongEntries' for detailed context during refinement."
    ),
  initialSongEntries: z.array(InitialSongEntrySchema)
    .min(1)
    .describe('An array of objects, where each object contains the language and the initial one song suggestion for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial song suggestions (applies to all selected languages).'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine song suggestions. This list should correspond to the languages present in initialSongEntries.'),
});

export type RefineSongSuggestionsInput = z.infer<
  typeof RefineSongSuggestionsInputSchema
>;

// Define the output schema for the refineSongSuggestions function.
const RefinedLanguageSongEntrySchema = z.object({
  language: z.string().describe("The name of the language for this refined song suggestion."),
  refinedSongSuggestions: z.array(z.string().min(1))
    .length(1)
    .describe("An array containing one refined song title in this language.")
});

const RefineSongSuggestionsOutputSchema = z.object({
  refinedLanguageSongEntries: z.array(RefinedLanguageSongEntrySchema)
    .describe("An array of refined song suggestion entries, one for each target language specified in the input."),
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
  prompt: `You are an expert music curator. You will be provided with a media description, an array of initial song entries (each for a specific language), user feedback, and a list of target languages.

  Your goal is to refine the initial song suggestions for all specified target languages based on the user feedback. For each target language, create a new set of one improved song suggestion.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description (general context): {{{mediaDescription}}}

  Initial Song Entries (use these as primary context for refinement per language):
  {{#each initialSongEntries}}
  Language: {{this.language}}
    {{#each this.songSuggestions}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial song suggestions provided.
  {{/each}}

  User Feedback on Songs (applies to all languages): {{{userFeedback}}}

  Return the refined song suggestions as an array in the 'refinedLanguageSongEntries' field. Each element in this array should be an object corresponding to one of the target languages.
  Each object in the 'refinedLanguageSongEntries' array must contain:
  - A 'language' field: The name of the language (e.g., "English", "Spanish").
  - A 'refinedSongSuggestions' field: An array containing exactly one refined song title string in that language.

  For example, if targetLanguages were ["English", "Spanish"]:
  "refinedLanguageSongEntries": [
    {
      "language": "English",
      "refinedSongSuggestions": ["Refined English Song Title"]
    },
    {
      "language": "Spanish",
      "refinedSongSuggestions": ["Título de Canción Refinado en Español"]
    }
  ]`,
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
