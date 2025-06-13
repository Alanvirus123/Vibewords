
'use server';

/**
 * @fileOverview A flow to refine song suggestions using Genkit.
 * Handles song suggestions in multiple user-specified languages.
 * Expects/returns data as arrays of language-specific entries.
 * It accepts multiple media data URIs if mediaType is 'image_collection' (up to 50 images).
 *
 * This file exports:
 * - `refineSongSuggestions`: An async function that refines song suggestions based on user input.
 * - `RefineSongSuggestionsInput`: The input type for the `refineSongSuggestions` function.
 * - `RefineSongSuggestionsOutput`: The output type for the `refineSongSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
      "An array of media items (1 to 50 images if mediaType is 'image_collection', or 1 image/video otherwise), each as a data URI. Data URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided (image, video, or image_collection).'),
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media content or context. The AI should primarily use the mediaDataUris and initialSongEntries for detailed context during refinement."
    ),
  initialSongEntries: z.array(InitialSongEntrySchema)
    .min(1)
    .describe('An array of objects, where each object contains the language and the initial two song suggestions for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial song suggestions (applies to all selected languages).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine song suggestions. This list should correspond to the languages present in initialSongEntries.'),
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
  language: z.string().describe("The name of the language for this refined song suggestion."),
  refinedSongSuggestions: z.array(z.string().min(1))
    .length(2)
    .describe("An array containing two refined song titles in this language.")
});

const RefineSongSuggestionsOutputSchema = z.object({
  refinedLanguageSongEntries: z.array(RefinedLanguageSongEntrySchema)
    .describe("An array of refined song suggestion entries, one for each target language specified in the input."),
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
  prompt: `You are an expert music curator. You will be provided with media (one or more images, or a video), a general media description, an array of initial song entries (each for a specific language, containing two song titles), userFeedback, and a list of target languages.

  Your goal is to refine the initial song suggestions for all specified target languages based on the user feedback and the provided media. For each target language, create a new set of two improved song suggestions. If multiple images are provided, the song suggestions should reflect the overall vibe of the collection.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  Provided Media:
  {{#if isImageCollection}}
    A collection of {{mediaDataUris.length}} images:
    {{#each mediaDataUris}}
      Image {{@index}}: {{media url=this}}
    {{/each}}
  {{/if}}
  {{#if isImage}}
    Image: {{media url=mediaDataUris.[0]}}
  {{/if}}
  {{#if isVideo}}
    Video: {{media url=mediaDataUris.[0]}}
  {{/if}}
  
  Media Description (general context): {{{mediaDescription}}}

  Initial Song Entries (use these as primary context for refinement per language):
  {{#each initialSongEntries}}
  Language: {{this.language}}
    Initial Songs for {{this.language}}:
    {{#each this.songSuggestions}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial song suggestions provided.
  {{/each}}

  User Feedback on Songs (applies to all languages): {{{userFeedback}}}

  Return the refined song suggestions as an array in the 'refinedLanguageSongEntries' field. Each element in this array should be an object corresponding to one of the target languages.
  Each object in the 'refinedLanguageSongEntries' array must contain:
  - A 'language' field: The name of the language (e.g., "English", "Spanish").
  - A 'refinedSongSuggestions' field: An array containing exactly two refined song title strings in that language.

  For example, if targetLanguages were ["English", "Spanish"]:
  "refinedLanguageSongEntries": [
    {
      "language": "English",
      "refinedSongSuggestions": ["Refined English Song Title 1", "Refined English Song Title 2"]
    },
    {
      "language": "Spanish",
      "refinedSongSuggestions": ["Título de Canción Refinado en Español 1", "Título de Canción Refinado en Español 2"]
    }
  ]`,
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
