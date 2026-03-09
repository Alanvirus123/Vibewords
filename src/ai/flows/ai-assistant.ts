
'use server';

/**
 * @fileOverview An AI assistant flow that answers user questions based on app context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MediaSuggestionsSchema = z.record(z.array(z.string()));

const AppContextSchema = z.object({
  hasMedia: z.boolean().describe("Whether media has been uploaded by the user."),
  mediaType: z.enum(['image', 'video', 'image_collection']).nullable().describe("The type of media uploaded."),
  vibe: z.string().nullable().describe("The detected vibe of the media."),
  targetPlatforms: z.array(z.string()).nullable().describe("The selected target platforms."),
  suggestedCaptions: MediaSuggestionsSchema.nullable().describe("The currently suggested captions, mapped by language."),
  suggestedSongs: MediaSuggestionsSchema.nullable().describe("The currently suggested songs, mapped by language."),
  captionRefinement: z.object({
    feedback: z.string().describe("The user's current feedback for refining captions."),
    tone: z.string().describe("The selected tone for caption refinement."),
  }),
  songRefinement: z.object({
    feedback: z.string().describe("The user's current feedback for refining songs."),
  }),
});

const AskAiAssistantInputSchema = z.object({
  question: z.string().describe("The user's question for the AI assistant."),
  appContext: AppContextSchema.describe("The current state of the application to provide context for the answer."),
});

export type AskAiAssistantInput = z.infer<typeof AskAiAssistantInputSchema>;

const AskAiAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's answer to the user's question."),
});

export type AskAiAssistantOutput = z.infer<typeof AskAiAssistantOutputSchema>;

export async function askAiAssistant(input: AskAiAssistantInput): Promise<AskAiAssistantOutput> {
  return askAiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAiAssistantPrompt',
  input: { schema: AskAiAssistantInputSchema },
  output: { schema: AskAiAssistantOutputSchema },
  prompt: `You are a helpful and friendly AI assistant for the VibeWords application. Your goal is to answer the user's questions and provide guidance.

**Current Application State:**
- Media Uploaded: {{appContext.hasMedia}}
{{#if appContext.hasMedia}}
- Media Type: {{appContext.mediaType}}
- Target Platforms: {{#each appContext.targetPlatforms}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
- Detected Vibe: {{appContext.vibe}}
- Selected Caption Tone: {{appContext.captionRefinement.tone}}
{{/if}}

**User's Question:**
"{{{question}}}"`,
});


const askAiAssistantFlow = ai.defineFlow(
  {
    name: 'askAiAssistantFlow',
    inputSchema: AskAiAssistantInputSchema,
    outputSchema: AskAiAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
