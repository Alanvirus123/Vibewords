
'use server';

/**
 * @fileOverview A flow to generate a video from a text prompt using the Veo model.
 *
 * This file exports:
 * - `generateVideo`: An async function that generates a video based on a text prompt.
 * - `GenerateVideoInput`: The input type for the `generateVideo` function.
 * - `GenerateVideoOutput`: The output type for the `generateVideo` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';


// Define the input schema for the generateVideo function.
const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
});

export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

// Define the output schema for the generateVideo function.
const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().describe("The generated video as a data URI. Expected format: 'data:video/mp4;base64,<encoded_data>'."),
});

export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    let { operation } = await googleAI.generateVideo({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: input.prompt,
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Poll for the result, waiting for the operation to complete.
    while (!operation.done) {
      // Wait for 5 seconds before checking the operation status again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);

    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Failed to find the generated video in the operation result');
    }

    // The URL from the operation is already a data URI.
    const response = await fetch(videoPart.media.url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      videoDataUri: `data:video/mp4;base64,${base64}`,
    };
  }
);
