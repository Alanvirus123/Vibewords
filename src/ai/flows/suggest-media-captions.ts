// 'use server';

/**
 * @fileOverview Media (image/video) caption suggestion AI agent.
 *
 * - suggestMediaCaptions - A function that handles the media caption suggestion process.
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
    .describe('An array of suggested captions for the media.'),
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
  prompt: `You are an expert social media manager. You will analyze the {{mediaType}} provided, and generate several captions that are relevant to the {{mediaType}}'s content. The captions should be engaging and appropriate for a general audience.

  {{mediaType}}: {{media url=mediaDataUri}}

  Return an array of suggested captions.`,
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
