
'use server';

/**
 * @fileOverview Media (image/video/image_collection) caption, song, and hashtag suggestion AI agent.
 * Outputs detailed song metadata (title, artist, description).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMediaCaptionsInputSchema = z.object({
  mediaDataUris: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe(
      "An array of media items as data URIs."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided.'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names.'),
  targetPlatforms: z.array(z.string()).min(1).describe('The target social media platforms.'),
});
export type SuggestMediaCaptionsInput = z.infer<typeof SuggestMediaCaptionsInputSchema>;

const SuggestMediaCaptionsPromptInputSchema = SuggestMediaCaptionsInputSchema.extend({
  isImage: z.boolean(),
  isVideo: z.boolean(),
  isImageCollection: z.boolean(),
});

const SongSuggestionSchema = z.object({
  title: z.string(),
  artist: z.string(),
  description: z.string(),
});

const LanguageSuggestionEntrySchema = z.object({
  language: z.string().describe("The name of the language."),
  captions: z.array(z.string().min(1)).length(4).describe("Four suggested captions."),
  songSuggestions: z.array(SongSuggestionSchema).length(3).describe("Three suggested songs with artist and description."),
  hashtags: z.array(z.string().min(1)).length(10).describe("Ten hashtags."),
});

const SuggestMediaCaptionsOutputSchema = z.object({
  languageEntries: z.array(LanguageSuggestionEntrySchema).describe("Suggestion entries by language."),
});
export type SuggestMediaCaptionsOutput = z.infer<typeof SuggestMediaCaptionsOutputSchema>;

export async function suggestMediaCaptions(
  input: SuggestMediaCaptionsInput
): Promise<SuggestMediaCaptionsOutput> {
  return suggestMediaCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMediaCaptionsPrompt',
  input: {schema: SuggestMediaCaptionsPromptInputSchema},
  output: {schema: SuggestMediaCaptionsOutputSchema},
  prompt: `You are an expert social media manager and music curator. Analyze the provided media and generate platform-optimized content for: {{#each targetPlatforms}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  Target Languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.
  
  For EACH language, provide:
  1. EXACTLY four captions.
  2. EXACTLY three song suggestions (title, artist, description).
     STRICT Cultural Authenticity:
     - Hindi: Suggest Bollywood/Hindi Pop/Indie.
     - Bengali: Suggest Rabindra Sangeet/Bengali Film/Baul/Bengali Pop.
     - No English songs for non-English languages unless explicitly fitting.
  3. EXACTLY ten hashtags.

  Media:
  {{#if isImageCollection}}Collection of {{mediaDataUris.length}} images.{{/if}}
  {{#if isImage}}Image: {{media url=mediaDataUris.[0]}}{{/if}}
  {{#if isVideo}}Video: {{media url=mediaDataUris.[0]}}{{/if}}

  Return output in 'languageEntries'.`,
});

const suggestMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'suggestMediaCaptionsFlow',
    inputSchema: SuggestMediaCaptionsInputSchema,
    outputSchema: SuggestMediaCaptionsOutputSchema,
  },
  async (flowInput) => {
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
