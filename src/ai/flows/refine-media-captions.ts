
// 'use server';
'use server';

/**
 * @fileOverview A flow to refine media (image/video) caption suggestions using Genkit.
 * This flow now handles captions in multiple languages: English, Bengali, and Hindi.
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
    .describe('A description of the media (image or video) for which captions are being refined, typically derived from the initial English caption.'),
  initialCaptions: z.object({
    english: z.array(z.string()).describe('Initial English caption(s) to refine.'),
    bengali: z.array(z.string()).describe('Initial Bengali caption(s) to refine.'),
    hindi: z.array(z.string()).describe('Initial Hindi caption(s) to refine.'),
  }).describe('The initial set of caption suggestions by language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions (applies to all languages).'),
  mediaType: z.enum(['image', 'video']).optional().describe('The type of the media provided (image or video).'),
});

export type RefineMediaCaptionsInput = z.infer<
  typeof RefineMediaCaptionsInputSchema
>;

// Define the output schema for the refineMediaCaptions function.
const RefineMediaCaptionsOutputSchema = z.object({
  refinedCaptions: z.object({
    english: z.array(z.string().min(1)).describe('An array containing one refined English caption.'),
    bengali: z.array(z.string().min(1)).describe('An array containing one refined Bengali caption.'),
    hindi: z.array(z.string().min(1)).describe('An array containing one refined Hindi caption.'),
  }).describe('Refined captions in English, Bengali, and Hindi. Each language should have one caption.'),
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
  prompt: `You are an expert caption writer. You will be provided with a media description, a list of initial caption suggestions (in English, Bengali, and Hindi), and user feedback on those captions.

  Your goal is to refine the initial captions for all languages based on the user feedback to create a new set of improved caption suggestions, one for each language.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description: {{{mediaDescription}}}

  Initial Captions:
  English: {{#if initialCaptions.english}}{{#each initialCaptions.english}}{{{this}}}{{else}}N/A{{/each}}{{else}}N/A{{/if}}
  Bengali: {{#if initialCaptions.bengali}}{{#each initialCaptions.bengali}}{{{this}}}{{else}}N/A{{/each}}{{else}}N/A{{/if}}
  Hindi: {{#if initialCaptions.hindi}}{{#each initialCaptions.hindi}}{{{this}}}{{else}}N/A{{/each}}{{else}}N/A{{/if}}

  User Feedback: {{{userFeedback}}}

  Return the refined captions in the 'refinedCaptions' field as an object with three keys: 'english', 'bengali', and 'hindi'. Each key should have an array containing exactly one refined caption string.
  For example:
  "refinedCaptions": {
    "english": ["Refined English Caption"],
    "bengali": ["পরিশোধিত বাংলা ক্যাপশন"],
    "hindi": ["परिष्कृत हिंदी कैप्शन"]
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

