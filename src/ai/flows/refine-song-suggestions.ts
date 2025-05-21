
'use server';

/**
 * @fileOverview A flow to refine song suggestions using Genkit.
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
    .describe('A description of the media (image or video) for which song suggestions are being refined.'),
  initialSongSuggestions: z.object({
    english: z.array(z.string()).describe('Initial English song suggestion(s).'),
    hindi: z.array(z.string()).describe('Initial Hindi song suggestion(s).'),
    bengali: z.array(z.string()).describe('Initial Bengali song suggestion(s).'),
  }).describe('The initial set of song suggestions to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial song suggestions.'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
});

export type RefineSongSuggestionsInput = z.infer<
  typeof RefineSongSuggestionsInputSchema
>;

// Define the output schema for the refineSongSuggestions function.
const RefineSongSuggestionsOutputSchema = z.object({
  refinedSongSuggestions: z.object({
     english: z.array(z.string()).describe('An array containing one refined English song title.'),
     hindi: z.array(z.string()).describe('An array containing one refined Hindi song title.'),
     bengali: z.array(z.string()).describe('An array containing one refined Bengali song title.'),
  }).describe('Refined song titles in English, Hindi, and Bengali. Each language should have one song title.'),
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
  prompt: `You are an expert music curator. You will be provided with a media description, a list of initial song suggestions (English, Hindi, Bengali), and user feedback on those songs.

  Your goal is to refine the initial song suggestions based on the user feedback to create a new set of improved song suggestions, one for each language.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description: {{{mediaDescription}}}

  Initial Song Suggestions:
  English: {{#each initialSongSuggestions.english}}{{{this}}}{{else}}N/A{{/each}}
  Hindi: {{#each initialSongSuggestions.hindi}}{{{this}}}{{else}}N/A{{/each}}
  Bengali: {{#each initialSongSuggestions.bengali}}{{{this}}}{{else}}N/A{{/each}}

  User Feedback on Songs: {{{userFeedback}}}

  Return the refined song suggestions in the 'refinedSongSuggestions' field as an object with three keys: 'english', 'hindi', and 'bengali'. Each key should have an array containing exactly one refined song title string.
  For example:
  "refinedSongSuggestions": {
    "english": ["Refined English Song Title"],
    "hindi": ["परिष्कृत हिंदी गीत शीर्षक"],
    "bengali": ["পরিশোধিত বাংলা গানের শিরোনাম"]
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
