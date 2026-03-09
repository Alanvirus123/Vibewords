'use server';

/**
 * @fileOverview A flow to refine song suggestions using Genkit.
 * Handles song suggestions in multiple user-specified languages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const maxDuration = 120;

const InitialSongEntrySchema = z.object({
  language: z.string().describe("The language of this initial song suggestion."),
  songSuggestions: z.array(z.string().min(1))
    .length(2)
    .describe("The initial two song suggestions for this language to refine.")
});

const RefineSongSuggestionsInputSchema = z.object({
  mediaDataUris: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe(
      "An array of media items as data URIs."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided.'),
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media content."
    ),
  initialSongEntries: z.array(InitialSongEntrySchema)
    .min(1)
    .describe('Initial song suggestions to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial song suggestions.'),
  artistPreference: z.string().optional().describe('User-specified artist preferences.'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine suggestions.'),
});

export type RefineSongSuggestionsInput = z.infer<
  typeof RefineSongSuggestionsInputSchema
>;

const RefineSongSuggestionsPromptInputSchema = RefineSongSuggestionsInputSchema.extend({
  isImage: z.boolean(),
  isVideo: z.boolean(),
  isImageCollection: z.boolean(),
});

const RefinedLanguageSongEntrySchema = z.object({
  language: z.string().describe("The name of the language."),
  refinedSongSuggestions: z.array(z.string().min(1))
    .length(2)
    .describe("Two refined song title strings.")
});

const RefineSongSuggestionsOutputSchema = z.object({
  refinedLanguageSongEntries: z.array(RefinedLanguageSongEntrySchema)
    .describe("Array of refined song suggestion entries."),
});

export type RefineSongSuggestionsOutput = z.infer<
  typeof RefineSongSuggestionsOutputSchema
>;

export async function refineSongSuggestions(
  input: RefineSongSuggestionsInput
): Promise<RefineSongSuggestionsOutput> {
  return refineSongSuggestionsFlow(input);
}

const refineSongSuggestionsPrompt = ai.definePrompt({
  name: 'refineSongSuggestionsPrompt',
  input: {schema: RefineSongSuggestionsPromptInputSchema},
  output: {schema: RefineSongSuggestionsOutputSchema},
  prompt: `You are an expert music curator. Refine the provided song suggestions for all specified target languages based on user feedback, artist preferences, and the media provided.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  **STRICT Cultural and Linguistic Authenticity:**
  For each language, the refined suggestions MUST be in that specific language/culture.
  - If the language is Bengali, provide Bengali songs.
  - If the language is Hindi, provide Hindi songs.
  - If the language is Spanish, provide Spanish/Latin tracks.
  - DO NOT provide English songs for non-English target languages unless explicitly requested by the user's feedback.

  Provided Media:
  {{#if isImageCollection}}
    A collection of {{mediaDataUris.length}} images.
  {{/if}}
  
  Media Description: {{{mediaDescription}}}

  Initial Song Entries:
  {{#each initialSongEntries}}
  Language: {{this.language}}
    Initial Songs:
    {{#each this.songSuggestions}}- {{{this}}}{{/each}}
  {{/each}}

  User Feedback on Songs: {{{userFeedback}}}
  {{#if artistPreference}}
  Artist/Genre Preferences: {{{artistPreference}}}
  {{/if}}

  Return the refined song suggestions as an array in 'refinedLanguageSongEntries'.`,
});

const refineSongSuggestionsFlow = ai.defineFlow(
  {
    name: 'refineSongSuggestionsFlow',
    inputSchema: RefineSongSuggestionsInputSchema,
    outputSchema: RefineSongSuggestionsOutputSchema,
  },
  async (flowInput: RefineSongSuggestionsInput) => {
    const promptInput = {
      ...flowInput,
      isImage: flowInput.mediaType === 'image',
      isVideo: flowInput.mediaType === 'video',
      isImageCollection: flowInput.mediaType === 'image_collection',
    };
    const {output} = await refineSongSuggestionsPrompt(promptInput);
    return output!;
  }
);