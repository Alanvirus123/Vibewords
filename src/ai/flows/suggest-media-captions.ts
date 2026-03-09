
'use server';

/**
 * @fileOverview Media (image/video/image_collection) caption, song, and hashtag suggestion AI agent.
 * Allows users to specify target languages and target social media platforms for generation.
 * Outputs suggestions as an array of language-specific entries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMediaCaptionsInputSchema = z.object({
  mediaDataUris: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe(
      "An array of media items (1 to 50 images if mediaType is 'image_collection', or 1 image/video otherwise), each as a data URI. Data URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided (image, video, or image_collection for multiple images).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names (e.g., "English", "Spanish") for which to generate captions and song suggestions.'),
  targetPlatforms: z.array(z.string()).min(1).describe('The target social media platforms (e.g., ["Instagram", "LinkedIn"]).'),
});
export type SuggestMediaCaptionsInput = z.infer<typeof SuggestMediaCaptionsInputSchema>;

const SuggestMediaCaptionsPromptInputSchema = SuggestMediaCaptionsInputSchema.extend({
  isImage: z.boolean(),
  isVideo: z.boolean(),
  isImageCollection: z.boolean(),
});

const LanguageSuggestionEntrySchema = z.object({
  language: z.string().describe("The name of the language for these suggestions (e.g., 'English', 'Spanish')."),
  captions: z.array(z.string().min(1))
    .length(4)
    .describe("An array of EXACTLY four suggested captions in this language."),
  songSuggestions: z.array(z.string().min(1))
    .length(2)
    .describe("An array containing EXACTLY two suggested song titles. These MUST be culturally and linguistically authentic to the specified language (e.g., Bollywood for Hindi, J-Pop for Japanese)."),
  hashtags: z.array(z.string().min(1))
    .length(10)
    .describe("An array of EXACTLY ten relevant hashtags in this language."),
});

const SuggestMediaCaptionsOutputSchema = z.object({
  languageEntries: z.array(LanguageSuggestionEntrySchema)
    .describe("An array of suggestion entries, one for each target language specified in the input."),
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
  prompt: `You are an expert social media manager and global music curator. You will analyze the provided media and generate platform-optimized content.

  Your task is to generate content tailored for the following platforms: {{#each targetPlatforms}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  **Linguistic and Cultural Song Selection:**
  Generate suggestions for ALL of the following languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.
  
  For EACH target language, you MUST provide:
  1. EXACTLY four captions in that language, optimized for the chosen platforms.
  2. EXACTLY two song suggestions. **Crucially**, these songs MUST be culturally and linguistically relevant to the specified language. 
     - For Indian languages (Hindi, Marathi, Tamil, etc.), suggest popular regional or Bollywood/Tollywood/Kollywood hits.
     - For East Asian languages, suggest K-Pop, J-Pop, or C-Pop as appropriate.
     - For European languages, suggest tracks popular in those specific cultural regions.
  3. EXACTLY ten hashtags in that language.

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

  Return your output as an array in the 'languageEntries' field. Each element in this array MUST be an object corresponding to one of the target languages.`,
});

const suggestMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'suggestMediaCaptionsFlow',
    inputSchema: SuggestMediaCaptionsInputSchema,
    outputSchema: SuggestMediaCaptionsOutputSchema,
  },
  async (flowInput: SuggestMediaCaptionsInput) => {
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
