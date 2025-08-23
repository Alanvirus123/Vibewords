
'use server';

/**
 * @fileOverview A flow to analyze the vibe of media using Genkit.
 *
 * This file exports:
 * - `analyzeMediaVibe`: An async function that analyzes the vibe of the media.
 * - `AnalyzeMediaVibeInput`: The input type for the `analyzeMediaVibe` function.
 * - `AnalyzeMediaVibeOutput`: The output type for the `analyzeMediaVibe` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMediaVibeInputSchema = z.object({
  mediaDataUris: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe(
      "An array of media items (1 to 50 images if mediaType is 'image_collection', or 1 image/video otherwise), each as a data URI. Data URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided (image, video, or image_collection).'),
});
export type AnalyzeMediaVibeInput = z.infer<typeof AnalyzeMediaVibeInputSchema>;


const AnalyzeMediaVibePromptInputSchema = AnalyzeMediaVibeInputSchema.extend({
  isImage: z.boolean(),
  isVideo: z.boolean(),
  isImageCollection: z.boolean(),
});

const AnalyzeMediaVibeOutputSchema = z.object({
  vibe: z.string().describe('A short, one-sentence analysis of the media\'s "vibe" (e.g., "This image has a serene, natural, and peaceful vibe.").'),
});
export type AnalyzeMediaVibeOutput = z.infer<typeof AnalyzeMediaVibeOutputSchema>;

export async function analyzeMediaVibe(
  input: AnalyzeMediaVibeInput
): Promise<AnalyzeMediaVibeOutput> {
  return analyzeMediaVibeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMediaVibePrompt',
  input: {schema: AnalyzeMediaVibePromptInputSchema},
  output: {schema: AnalyzeMediaVibeOutputSchema},
  prompt: `You are an expert in analyzing the mood and feeling of media. You will be provided with media (one or more images, or a video).
  Your task is to analyze the media and provide a short, one-sentence analysis of its "vibe".

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

  Return your output as a single string in the 'vibe' field.
  For example: "This image has a serene, natural, and peaceful vibe." or "This video feels energetic, fun, and celebratory."
  `,
});

const analyzeMediaVibeFlow = ai.defineFlow(
  {
    name: 'analyzeMediaVibeFlow',
    inputSchema: AnalyzeMediaVibeInputSchema,
    outputSchema: AnalyzeMediaVibeOutputSchema,
  },
  async (flowInput: AnalyzeMediaVibeInput) => {
    const promptInput = {
      ...flowInput,
      isImage: flowInput.mediaType === 'image',
      isVideo: flowInput.mediaType === 'video',
      isImageCollection: flowInput.mediaType === 'image_collection',
    };
    const {output} = await prompt(promptInput);
    return output!;
  }
);
