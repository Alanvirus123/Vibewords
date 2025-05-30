
// 'use server';

/**
 * @fileOverview Media (image/video) caption and song suggestion AI agent.
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
});
export type SuggestMediaCaptionsInput = z.infer<typeof SuggestMediaCaptionsInputSchema>;

const SuggestMediaCaptionsOutputSchema = z.object({
  captions: z.object({
    english: z.array(z.string().min(1)).describe('An array containing one suggested English caption.'),
    bengali: z.array(z.string().min(1)).describe('An array containing one suggested Bengali caption.'),
    hindi: z.array(z.string().min(1)).describe('An array containing one suggested Hindi caption.'),
  }).describe('Suggested captions in English, Bengali, and Hindi. Each language should have one caption.'),
  songSuggestions: z.object({
    english: z.array(z.string()).describe('An array containing one English song title.'),
    hindi: z.array(z.string()).describe('An array containing one Hindi song title.'),
    bengali: z.array(z.string()).describe('An array containing one Bengali song title.'),
  }).describe('Suggested song titles in English, Hindi, and Bengali. Each language should have one song title.'),
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
  Generate one engaging caption for each of the following languages: English, Bengali, and Hindi. The captions should be relevant to the {{mediaType}}'s content and appropriate for a general audience.
  Also, suggest song titles that would fit the mood or theme of the {{mediaType}}.

  {{mediaType}}: {{media url=mediaDataUri}}

  Return the suggested captions in the 'captions' field as an object with three keys: 'english', 'bengali', and 'hindi'. Each key should have an array containing exactly one caption string.
  For example:
  "captions": {
    "english": ["Example English Caption"],
    "bengali": ["উদাহরণ বাংলা ক্যাপশন"],
    "hindi": ["उदाहरण हिंदी कैप्शन"]
  }

  Return the song suggestions in the 'songSuggestions' field as an object with three keys: 'english', 'hindi', and 'bengali'. Each key should have an array containing exactly one song title string.
  For example:
  "songSuggestions": {
    "english": ["Example English Song Title"],
    "hindi": ["उदाहरण हिंदी गीत शीर्षक"],
    "bengali": ["উদাহরণ বাংলা গানের শিরোনাম"]
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

