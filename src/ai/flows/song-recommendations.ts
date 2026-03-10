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

// A simple helper function to make the code pause
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Original song recommendation function.
 */
export async function getSongRecommendations(input: SongRequest): Promise<SongResponse> {
  return getSongRecommendationsFlow(input);
}

/**
 * A "safe" version of song recommendations that retries on rate limit (429) errors.
 * Uses exponential backoff.
 */
export async function getSongRecommendationsSafe(input: SongRequest, maxRetries = 3): Promise<SongResponse> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try calling your original function
      return await getSongRecommendations(input);
      
    } catch (error: any) {
      // Check if the error is a rate limit (429)
      // We check for '429' in message or a status property if available
      if (error.message?.includes('429') || error.status === 429) {
        // Calculate wait time: 2s, then 4s, then 8s...
        const waitTime = (2 ** attempt) * 1000; 
        console.warn(`Rate limit hit! Waiting ${waitTime / 1000} seconds before retrying (Attempt ${attempt + 1})...`);
        
        await delay(waitTime); 
      } else {
        // If it's a different kind of error, throw it immediately
        throw error; 
      }
    }
  }
  
  throw new Error("Sorry, the servers are too busy right now. Please try again in a minute.");
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
