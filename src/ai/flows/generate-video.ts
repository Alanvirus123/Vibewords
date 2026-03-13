
'use server';

/**
 * @fileOverview A flow to generate cinematic videos from images using the Veo model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateVideoInputSchema = z.object({
  imageDataUri: z.string().describe("The image as a data URI to animate."),
  prompt: z.string().optional().describe("Optional prompt for the animation (e.g., 'make the waves crash')."),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().describe("The generated video as a data URI."),
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
  async ({ imageDataUri, prompt }) => {
    // Initiate the video generation operation
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: [
        { text: prompt || 'Animate this photo with subtle, graceful cinematic movement' },
        { media: { url: imageDataUri, contentType: 'image/jpeg' } },
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Could not initiate video generation operation.');
    }

    // Polling for completion (Video generation takes time)
    let attempts = 0;
    while (!operation.done && attempts < 24) { // Max ~2 minutes
      operation = await ai.checkOperation(operation);
      if (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (!operation.done) {
      throw new Error('Video generation timed out. Please try again.');
    }

    if (operation.error) {
      throw new Error('Veo generation failed: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart?.media?.url) {
      throw new Error('No video media returned from the model.');
    }

    // Fetch the video file and convert to data URI for the client
    const apiKey = process.env.GEMINI_API_KEY;
    const fetchResponse = await fetch(`${videoPart.media.url}&key=${apiKey}`);
    
    if (!fetchResponse.ok) {
      throw new Error('Failed to download generated video content.');
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      videoDataUri: `data:video/mp4;base64,${base64}`,
    };
  }
);
