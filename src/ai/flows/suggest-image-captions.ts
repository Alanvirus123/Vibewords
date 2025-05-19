// 'use server';

/**
 * @fileOverview Image caption suggestion AI agent.
 *
 * - suggestImageCaptions - A function that handles the image caption suggestion process.
 * - SuggestImageCaptionsInput - The input type for the suggestImageCaptions function.
 * - SuggestImageCaptionsOutput - The return type for the suggestImageCaptions function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImageCaptionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to generate captions for, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestImageCaptionsInput = z.infer<typeof SuggestImageCaptionsInputSchema>;

const SuggestImageCaptionsOutputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('An array of suggested captions for the image.'),
});
export type SuggestImageCaptionsOutput = z.infer<typeof SuggestImageCaptionsOutputSchema>;

export async function suggestImageCaptions(
  input: SuggestImageCaptionsInput
): Promise<SuggestImageCaptionsOutput> {
  return suggestImageCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImageCaptionsPrompt',
  input: {schema: SuggestImageCaptionsInputSchema},
  output: {schema: SuggestImageCaptionsOutputSchema},
  prompt: `You are an expert social media manager. You will analyze the image provided, and generate several captions that are relevant to the image's content. The captions should be engaging and appropriate for a general audience.

  Photo: {{media url=photoDataUri}}

  Return an array of suggested captions.`,
});

const suggestImageCaptionsFlow = ai.defineFlow(
  {
    name: 'suggestImageCaptionsFlow',
    inputSchema: SuggestImageCaptionsInputSchema,
    outputSchema: SuggestImageCaptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
