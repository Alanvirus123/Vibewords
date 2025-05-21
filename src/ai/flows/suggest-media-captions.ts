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
  captions: z
    .array(z.string())
    .describe('An array of 4 suggested captions for the media.'),
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
  Generate four engaging captions that are relevant to the {{mediaType}}'s content. The captions should be appropriate for a general audience.
  Also, suggest song titles that would fit the mood or theme of the {{mediaType}}.

  {{mediaType}}: {{media url=mediaDataUri}}

  Return an array of 4 suggested captions in the 'captions' field.
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
