import { config } from 'dotenv';
config();

import '@/ai/flows/refine-media-captions.ts';
import '@/ai/flows/suggest-media-captions.ts';
import '@/ai/flows/refine-song-suggestions.ts';
import '@/ai/flows/ai-assistant.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/analyze-media-vibe.ts';
import '@/ai/flows/song-recommendations.ts';
import '@/services/firebase.ts';
