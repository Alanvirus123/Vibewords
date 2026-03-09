'use server';

/**
 * @fileOverview A flow to refine media caption suggestions using Genkit.
 * Handles platform-specific refinement based on user feedback and target platforms.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const maxDuration = 120;

const InitialCaptionEntrySchema = z.object({
  language: z.string().describe("The language of these initial captions."),
  captions: z.array(z.string().min(1))
    .length(4)
    .describe("The initial four captions for this language to refine.")
});

const RefineMediaCaptionsInputSchema = z.object({
  mediaDataUris: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe("An array of media items as data URIs."),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided.'),
  mediaDescription: z.string().describe("A general description of the media content."),
  initialCaptionEntries: z.array(InitialCaptionEntrySchema).min(1).describe('Initial captions to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions.'),
  tone: z.string().optional().describe('An optional tone to apply.'),
  targetLanguages: z.array(z.string()).min(1).describe('Array of language names.'),
  targetPlatforms: z.array(z.string()).min(1).describe('The target social media platforms.'),
});

export type RefineMediaCaptionsInput = z.infer<typeof RefineMediaCaptionsInputSchema>;

const RefineMediaCaptionsPromptInputSchema = RefineMediaCaptionsInputSchema.extend({
  isImage: z.boolean(),
  isVideo: z.boolean(),
  isImageCollection: z.boolean(),
});

const RefinedLanguageCaptionEntrySchema = z.object({
  language: z.string().describe("The name of the language."),
  refinedCaptions: z.array(z.string().min(1)).length(4).describe("Four refined captions.")
});

const RefineMediaCaptionsOutputSchema = z.object({
  refinedLanguageEntries: z.array(RefinedLanguageCaptionEntrySchema).describe("Array of refined caption entries."),
});

export type RefineMediaCaptionsOutput = z.infer<typeof RefineMediaCaptionsOutputSchema>;

export async function refineMediaCaptions(input: RefineMediaCaptionsInput): Promise<RefineMediaCaptionsOutput> {
  return refineMediaCaptionsFlow(input);
}

const refineMediaCaptionsPrompt = ai.definePrompt({
  name: 'refineMediaCaptionsPrompt',
  input: {schema: RefineMediaCaptionsPromptInputSchema},
  output: {schema: RefineMediaCaptionsOutputSchema},
  prompt: `You are an expert social media manager. Refine the provided captions for the following platforms: {{#each targetPlatforms}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  Ensure the refinement respects the platform styles.
  {{#if tone}}
  - Requested Tone: **{{{tone}}}**
  {{/if}}

  Target Languages: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  Media Description: {{{mediaDescription}}}

  User Feedback: {{{userFeedback}}}

  Initial Caption Entries:
  {{#each initialCaptionEntries}}
  Language: {{this.language}}
    Initial Captions:
    {{#each this.captions}}- {{{this}}}{{/each}}
  {{/each}}

  Return the refined captions as an array in 'refinedLanguageEntries'.`,
});

const refineMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'refineMediaCaptionsFlow',
    inputSchema: RefineMediaCaptionsInputSchema,
    outputSchema: RefineMediaCaptionsOutputSchema,
  },
  async (flowInput: RefineMediaCaptionsInput) => {
    const promptInput = {
      ...flowInput,
      isImage: flowInput.mediaType === 'image',
      isVideo: flowInput.mediaType === 'video',
      isImageCollection: flowInput.mediaType === 'image_collection',
    };
    const {output} = await refineMediaCaptionsPrompt(promptInput);
    return output!;
  }
);