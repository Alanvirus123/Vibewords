
'use server';

/**
 * @fileOverview A flow to refine song suggestions with detailed metadata.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SongSuggestionSchema = z.object({
  title: z.string(),
  artist: z.string(),
  description: z.string(),
});

const InitialSongEntrySchema = z.object({
  language: z.string().describe("The language of this initial song suggestion."),
  songSuggestions: z.array(SongSuggestionSchema).describe("The initial song suggestions to refine.")
});

const RefineSongSuggestionsInputSchema = z.object({
  mediaDataUris: z.array(z.string().min(1)).min(1).max(50),
  mediaType: z.enum(['image', 'video', 'image_collection']),
  mediaDescription: z.string(),
  initialSongEntries: z.array(InitialSongEntrySchema),
  userFeedback: z.string(),
  artistPreference: z.string().optional(),
  targetLanguages: z.array(z.string()).min(1),
});

export type RefineSongSuggestionsInput = z.infer<typeof RefineSongSuggestionsInputSchema>;

const RefinedLanguageSongEntrySchema = z.object({
  language: z.string().describe("The name of the language."),
  refinedSongSuggestions: z.array(SongSuggestionSchema).length(3).describe("Three refined songs.")
});

const RefineSongSuggestionsOutputSchema = z.object({
  refinedLanguageSongEntries: z.array(RefinedLanguageSongEntrySchema),
});

export type RefineSongSuggestionsOutput = z.infer<typeof RefineSongSuggestionsOutputSchema>;

export async function refineSongSuggestions(input: RefineSongSuggestionsInput): Promise<RefineSongSuggestionsOutput> {
  return refineSongSuggestionsFlow(input);
}

const refineSongSuggestionsPrompt = ai.definePrompt({
  name: 'refineSongSuggestionsPrompt',
  input: {schema: RefineSongSuggestionsInputSchema},
  output: {schema: RefineSongSuggestionsOutputSchema},
  prompt: `Refine song suggestions based on feedback: "{{userFeedback}}".
  
  Languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.
  
  STRICT Cultural Authenticity:
  - Bengali songs for Bengali, Hindi for Hindi, etc.
  
  Artist Preference: {{artistPreference}}
  
  Initial Songs:
  {{#each initialSongEntries}}
  - {{this.language}}: {{#each this.songSuggestions}}{{this.title}} by {{this.artist}}, {{/each}}
  {{/each}}

  Return three refined songs per language in 'refinedLanguageSongEntries'.`,
});

const refineSongSuggestionsFlow = ai.defineFlow(
  {
    name: 'refineSongSuggestionsFlow',
    inputSchema: RefineSongSuggestionsInputSchema,
    outputSchema: RefineSongSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await refineSongSuggestionsPrompt(input);
    return output!;
  }
);
