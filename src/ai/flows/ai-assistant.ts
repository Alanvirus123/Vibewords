'use server';

/**
 * @fileOverview An AI assistant flow that answers user questions based on app context.
 *
 * This file exports:
 * - `askAiAssistant`: An async function that provides answers from the AI assistant.
 * - `AskAiAssistantInput`: The input type for the `askAiAssistant` function.
 * - `AskAiAssistantOutput`: The output type for the `askAiAssistant` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MediaSuggestionsSchema = z.record(z.array(z.string()));

const AppContextSchema = z.object({
  hasMedia: z.boolean().describe("Whether media has been uploaded by the user."),
  mediaType: z.enum(['image', 'video', 'image_collection']).nullable().describe("The type of media uploaded."),
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

You have access to the current state of the application, which includes the user's uploaded media (if any), suggested captions and songs, and their refinement feedback. Use this context to provide relevant, specific, and helpful answers.

**Your Persona:**
- Friendly, encouraging, and slightly witty.
- You are an expert in social media marketing and content creation.
- Keep your answers concise and easy to understand. Use formatting like lists or bold text to improve readability.

**Current Application State (for your context):**
- Media Uploaded: {{appContext.hasMedia}}
{{#if appContext.hasMedia}}
- Media Type: {{appContext.mediaType}}
- Suggested Captions: {{#if appContext.suggestedCaptions}}Yes (scroll down to view){{else}}No{{/if}}
- Suggested Songs: {{#if appContext.suggestedSongs}}Yes (scroll down to view){{else}}No{{/if}}
- Caption Feedback provided by user: {{#if appContext.captionRefinement.feedback}}"{{appContext.captionRefinement.feedback}}"{{else}}None{{/if}}
- Selected Caption Tone: {{appContext.captionRefinement.tone}}
- Song Feedback provided by user: {{#if appContext.songRefinement.feedback}}"{{appContext.songRefinement.feedback}}"{{else}}None{{/if}}
{{/if}}

---

**User's Question:**
"{{{question}}}"

---

Based on the application state and the user's question, provide a helpful answer.
- If the question is general (e.g., "how do I get more likes?"), give general social media advice.
- If the question is specific to the app's current state (e.g., "make my captions shorter"), use the context to give a tailored recommendation. For example, you could suggest specific wording for their refinement feedback.
- If the user asks you to perform an action you can't do (like "delete the photo"), politely explain that you can't perform that action and guide them on how they can do it themselves using the app's UI.
- Your response should be in the "answer" field.`,
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
