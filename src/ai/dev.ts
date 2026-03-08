import { config } from 'dotenv';
config();

import '@/ai/flows/refine-media-captions.ts';
import '@/ai/flows/suggest-media-captions.ts';
import '@/ai/flows/refine-song-suggestions.ts';
import '@/ai/flows/ai-assistant.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/services/firebase.ts';
