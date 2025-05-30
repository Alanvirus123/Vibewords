
// 'use server';
'use server';

/**
 * @fileOverview A flow to refine media (image/video) caption suggestions using Genkit.
 * This flow now handles captions in multiple languages: English, Bengali, and Hindi, producing four refined captions per language.
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
    .describe('A description of the media (image or video) for which captions are being refined, typically derived from the initial English caption(s).'),
  initialCaptions: z.object({
    english: z.array(z.string()).describe('Initial English caption(s) to refine (typically an array of four).'),
    bengali: z.array(z.string()).describe('Initial Bengali caption(s) to refine (typically an array of four).'),
    hindi: z.array(z.string()).describe('Initial Hindi caption(s) to refine (typically an array of four).'),
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
    english: z.array(z.string().min(1)).describe('An array containing four refined English captions.'),
    bengali: z.array(z.string().min(1)).describe('An array containing four refined Bengali captions.'),
    hindi: z.array(z.string().min(1)).describe('An array containing four refined Hindi captions.'),
  }).describe('Refined captions in English, Bengali, and Hindi. Each language should have four captions.'),
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
  prompt: `You are an expert caption writer. You will be provided with a media description, a list of initial caption suggestions (in English, Bengali, and Hindi - typically four for each), and user feedback on those captions.

  Your goal is to refine the initial captions for all languages based on the user feedback to create a new set of four improved caption suggestions for each language.

  {{#if mediaType}}Media Type: {{mediaType}}{{/if}}
  Media Description: {{{mediaDescription}}}

  Initial Captions:
  English: {{#if initialCaptions.english}}{{#each initialCaptions.english}}- {{{this}}}\n{{else}}N/A{{/each}}{{else}}N/A{{/if}}
  Bengali: {{#if initialCaptions.bengali}}{{#each initialCaptions.bengali}}- {{{this}}}\n{{else}}N/A{{/each}}{{else}}N/A{{/if}}
  Hindi: {{#if initialCaptions.hindi}}{{#each initialCaptions.hindi}}- {{{this}}}\n{{else}}N/A{{/each}}{{else}}N/A{{/if}}

  User Feedback: {{{userFeedback}}}

  Return the refined captions in the 'refinedCaptions' field as an object with three keys: 'english', 'bengali', and 'hindi'. Each key should have an array containing exactly four refined caption strings.
  For example:
  "refinedCaptions": {
    "english": ["Refined English Caption 1", "Refined English Caption 2", "Refined English Caption 3", "Refined English Caption 4"],
    "bengali": ["পরিশোধিত বাংলা ক্যাপশন ১", "পরিশোধিত বাংলা ক্যাপশন ২", "পরিশোধিত বাংলা ক্যাপশন ৩", "পরিশোধিত বাংলা ক্যাপশন ৪"],
    "hindi": ["परिष्कृत हिंदी कैप्शन १", "परिष्कृत हिंदी कैप्शन २", "परिष्कृत हिंदी कैप्शन ३", "परिष्कृत हिंदी कैप्शन ४"]
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

