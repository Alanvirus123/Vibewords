'use server';

/**
 * @fileOverview Detailed mood-based song recommendation AI agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SongRequestSchema = z.object({
  mood: z.string().describe('The vibe or mood the user wants (e.g., chill, workout, romantic)'),
  languages: z.array(z.string()).describe('An array of languages (e.g., ["English", "Bengali", "Hindi"])'),
});

export const SongResponseSchema = z.object({
  playlists: z.array(
    z.object({
      language: z.string(),
      songs: z.array(
        z.object({
          title: z.string(),
          artist: z.string(),
          description: z.string().describe('A short sentence on why this song fits the mood'),
        })
      ),
    })
  ),
});

export type SongRequest = z.infer<typeof SongRequestSchema>;
export type SongResponse = z.infer<typeof SongResponseSchema>;

export async function getSongRecommendations(input: SongRequest): Promise<SongResponse> {
  return getSongRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSongRecommendationsPrompt',
  input: { schema: SongRequestSchema },
  output: { schema: SongResponseSchema },
  prompt: `You are an expert music curator. Suggest 3 amazing songs for the following mood: "{{mood}}". 
  Please provide recommendations for each of these languages: {{#each languages}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
  
  For each song, include the title, artist, and a brief description of why it fits the vibe.
  STRICT Cultural and Linguistic Authenticity:
  - If language is Hindi, suggest Hindi/Bollywood/Indipop.
  - If language is Bengali, suggest Bengali/Rabindra Sangeet/Baul/Bengali Pop.
  - Do NOT suggest English songs for non-English languages.`,
});

const getSongRecommendationsFlow = ai.defineFlow(
  {
    name: 'getSongRecommendationsFlow',
    inputSchema: SongRequestSchema,
    outputSchema: SongResponseSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
