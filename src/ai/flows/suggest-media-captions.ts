
// 'use server';

/**
 * @fileOverview Media (image/video) caption and song suggestion AI agent.
 * Allows users to specify target languages for generation.
 * Outputs suggestions as an array of language-specific entries.
 *
 * This file exports:
 * - `suggestMediaCaptions`: A function that handles the media caption and song suggestion process.
 * - `SuggestMediaCaptionsInput`: The input type for the `suggestMediaCaptions` function.
 * - `SuggestMediaCaptionsOutput`: The output type for the `suggestMediaCaptions` function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMediaCaptionsInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "Media (image or video) to generate captions for, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video']).describe('The type of the media provided (image or video).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names (e.g., "English", "Spanish") for which to generate captions and song suggestions.'),
});
export type SuggestMediaCaptionsInput = z.infer<typeof SuggestMediaCaptionsInputSchema>;

const LanguageSuggestionEntrySchema = z.object({
  language: z.string().describe("The name of the language for these suggestions (e.g., 'English', 'Spanish'). This field is MANDATORY."),
  captions: z.array(z.string().min(1))
    .length(4)
    .describe("An array of EXACTLY four suggested captions in this language. This field is MANDATORY."),
  songSuggestions: z.array(z.string().min(1))
    .length(2)
    .describe("An array containing EXACTLY two suggested song titles in this language. This field is MANDATORY.")
});

const SuggestMediaCaptionsOutputSchema = z.object({
  languageEntries: z.array(LanguageSuggestionEntrySchema)
    .describe("An array of suggestion entries, one for each target language specified in the input. Each entry MUST conform to the LanguageSuggestionEntrySchema."),
});
export type SuggestMediaCaptionsOutput = z.infer<typeof SuggestMediaCaptionsOutputSchema>;

export async function suggestMediaCaptions(
  input: SuggestMediaCaptionsInput
): Promise<SuggestMediaCaptionsOutput> {
  return suggestMediaCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMediaCaptionsPrompt',
  input: {schema: SuggestMediaCaptionsInputSchema},
  output: {schema: SuggestMediaCaptionsOutputSchema},
  prompt: `You are an expert social media manager. You will analyze the {{mediaType}} provided.
  Your task is to generate content for ALL of the following languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  For EACH of these target languages, you MUST generate:
  1. EXACTLY four engaging captions. The captions should be relevant to the {{mediaType}}'s content and appropriate for a general audience.
  2. EXACTLY two song titles that would fit the mood or theme of the {{mediaType}}.

  {{mediaType}}: {{media url=mediaDataUri}}

  Return your output as an array in the 'languageEntries' field. Each element in this array MUST be an object corresponding to one of the target languages.
  Each object in the 'languageEntries' array MUST contain ALL of the following fields:
  - 'language': A string with the name of the language (e.g., "English", "Spanish"). This MUST be one of the target languages.
  - 'captions': An array of EXACTLY four caption strings in that language.
  - 'songSuggestions': An array containing EXACTLY two song title strings in that language.

  Ensure that every language listed in 'targetLanguages' has a corresponding entry in the 'languageEntries' array, and each entry is complete with all required fields.

  Example for 'languageEntries' if targetLanguages were ["English", "Spanish"]:
  "languageEntries": [
    {
      "language": "English",
      "captions": ["English Caption 1", "English Caption 2", "English Caption 3", "English Caption 4"],
      "songSuggestions": ["Example English Song Title 1", "Example English Song Title 2"]
    },
    {
      "language": "Spanish",
      "captions": ["Leyenda en Español 1", "Leyenda en Español 2", "Leyenda en Español 3", "Leyenda en Español 4"],
      "songSuggestions": ["Título de Canción en Español de Ejemplo 1", "Título de Canción en Español de Ejemplo 2"]
    }
  ]`,
});

const suggestMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'suggestMediaCaptionsFlow',
    inputSchema: SuggestMediaCaptionsInputSchema,
    outputSchema: SuggestMediaCaptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

