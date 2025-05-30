
// 'use server';

/**
 * @fileOverview Media (image/video) caption and song suggestion AI agent.
 * Allows users to specify target languages for generation.
 *
 * - suggestMediaCaptions - A function that handles the media caption and song suggestion process.
 * - SuggestMediaCaptionsInput - The input type for the suggestMediaCaptions function.
 * - SuggestMediaCaptionsOutput - The return type for the suggestMediaCaptions function.
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

const SuggestMediaCaptionsOutputSchema = z.object({
  captions: z.record(z.string(), z.array(z.string().min(1)).length(4))
    .describe('An object where each key is a language name (from targetLanguages) and the value is an array of four suggested captions for that language.'),
  songSuggestions: z.record(z.string(), z.array(z.string()).length(1))
    .describe('An object where each key is a language name (from targetLanguages) and the value is an array of one suggested song title for that language.'),
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
  Your task is to generate content for the following languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  For each of these languages, generate exactly four engaging captions. The captions should be relevant to the {{mediaType}}'s content and appropriate for a general audience.
  Also, for each of these languages, suggest exactly one song title that would fit the mood or theme of the {{mediaType}}.

  {{mediaType}}: {{media url=mediaDataUri}}

  Return the suggested captions in the 'captions' field. This field should be an object where each key is one of the target language names you were given (e.g., "English", "Spanish"), and the value for each key is an array containing exactly four caption strings in that language.
  Example for 'captions' if targetLanguages were ["English", "Spanish"]:
  "captions": {
    "English": ["English Caption 1", "English Caption 2", "English Caption 3", "English Caption 4"],
    "Spanish": ["Spanish Caption 1", "Spanish Caption 2", "Spanish Caption 3", "Spanish Caption 4"]
  }

  Return the song suggestions in the 'songSuggestions' field. This field should be an object where each key is one of the target language names, and the value for each key is an array containing exactly one song title string in that language.
  Example for 'songSuggestions' if targetLanguages were ["English", "Spanish"]:
  "songSuggestions": {
    "English": ["Example English Song Title"],
    "Spanish": ["Título de Canción en Español de Ejemplo"]
  }`,
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
