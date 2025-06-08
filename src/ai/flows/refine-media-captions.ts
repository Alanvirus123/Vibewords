
'use server';

/**
 * @fileOverview A flow to refine media (image/video/image_collection) caption suggestions using Genkit.
 * This flow now handles captions in multiple user-specified languages, producing four refined captions per language,
 * and expects/returns data as arrays of language-specific entries.
 * It accepts multiple media data URIs if mediaType is 'image_collection'.
 *
 * This file exports:
 * - `refineMediaCaptions`: An async function that refines caption suggestions based on user input.
 * - `RefineMediaCaptionsInput`: The input type for the `refineMediaCaptions` function.
 * - `RefineMediaCaptionsOutput`: The output type for the `refineMediaCaptions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
    .max(8)
    .describe(
      "An array of media items (1 to 8 images if mediaType is 'image_collection', or 1 image/video otherwise), each as a data URI. Data URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video', 'image_collection']).describe('The type of the media provided (image, video, or image_collection).'),
  mediaDescription: z
    .string()
    .describe(
      "A general description of the media content or context. The AI should primarily use the mediaDataUris and initialCaptionEntries for detailed context during refinement."
    ),
  initialCaptionEntries: z.array(InitialCaptionEntrySchema)
    .min(1)
    .describe('An array of objects, where each object contains the language and the initial four captions for that language to refine.'),
  userFeedback: z.string().describe('The user feedback on the initial captions (applies to all selected languages).'),
  targetLanguages: z.array(z.string()).min(1).describe('An array of language names for which to refine captions. This list should correspond to the languages present in initialCaptionEntries.'),
});

export type RefineMediaCaptionsInput = z.infer<
  typeof RefineMediaCaptionsInputSchema
>;

const RefinedLanguageCaptionEntrySchema = z.object({
  language: z.string().describe("The name of the language for these refined captions."),
  refinedCaptions: z.array(z.string().min(1))
    .length(4)
    .describe("An array of four refined captions in this language.")
});

const RefineMediaCaptionsOutputSchema = z.object({
  refinedLanguageEntries: z.array(RefinedLanguageCaptionEntrySchema)
    .describe("An array of refined caption entries, one for each target language specified in the input."),
});

export type RefineMediaCaptionsOutput = z.infer<
  typeof RefineMediaCaptionsOutputSchema
>;

export async function refineMediaCaptions(
  input: RefineMediaCaptionsInput
): Promise<RefineMediaCaptionsOutput> {
  return refineMediaCaptionsFlow(input);
}

const refineMediaCaptionsPrompt = ai.definePrompt({
  name: 'refineMediaCaptionsPrompt',
  input: {schema: RefineMediaCaptionsInputSchema},
  output: {schema: RefineMediaCaptionsOutputSchema},
  prompt: `You are an expert caption writer. You will be provided with media (one or more images, or a video), a general media description, an array of initial caption entries (each for a specific language), user feedback, and a list of target languages.

  Your goal is to refine the initial captions for all specified target languages based on the user feedback and the provided media. For each target language, create a new set of four improved caption suggestions.

  Target Languages for Refinement: {{#each targetLanguages}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  Provided Media:
  {{#if (eq mediaType "image_collection")}}
    A collection of {{mediaDataUris.length}} images:
    {{#each mediaDataUris}}
      Image {{@index}}: {{media url=this}}
    {{/each}}
  {{else if (eq mediaType "image")}}
    Image: {{media url=mediaDataUris.[0]}}
  {{else if (eq mediaType "video")}}
    Video: {{media url=mediaDataUris.[0]}}
  {{/if}}

  Media Description (general context): {{{mediaDescription}}}

  Initial Caption Entries (use these as primary context for refinement per language):
  {{#each initialCaptionEntries}}
  Language: {{this.language}}
    Initial Captions for {{this.language}}:
    {{#each this.captions}}- {{{this}}}\n{{/each}}
  {{else}}
  No initial captions provided.
  {{/each}}

  User Feedback (applies to all languages): {{{userFeedback}}}

  Return the refined captions as an array in the 'refinedLanguageEntries' field. Each element in this array should be an object corresponding to one of the target languages.
  Each object in the 'refinedLanguageEntries' array must contain:
  - A 'language' field: The name of the language (e.g., "English", "Spanish").
  - A 'refinedCaptions' field: An array of exactly four refined caption strings in that language.

  Example for 'refinedLanguageEntries' if targetLanguages were ["English", "Spanish"]:
  "refinedLanguageEntries": [
    {
      "language": "English",
      "refinedCaptions": ["Refined English Caption 1", "Refined English Caption 2", "Refined English Caption 3", "Refined English Caption 4"]
    },
    {
      "language": "Spanish",
      "refinedCaptions": ["Leyenda en Español Refinada 1", "Leyenda en Español Refinada 2", "Leyenda en Español Refinada 3", "Leyenda en Español Refinada 4"]
    }
  ]`,
});

const refineMediaCaptionsFlow = ai.defineFlow(
  {
    name: 'refineMediaCaptionsFlow',
    inputSchema: RefineMediaCaptionsInputSchema,
    outputSchema: RefineMediaCaptionsOutputSchema,
  },
  async input => {
    const {output} = await refineMediaCaptionsPrompt(input);
    return output!;
  }
);
