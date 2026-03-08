/**
 * @fileOverview A direct client for the Gemini API with model resolution and retry logic.
 */

import { GeminiError } from "./gemini-error";

const BASE_URL = "https://generativelanguage.googleapis.com";
const API_VERSION = "v1";

interface GeminiModel {
  name: string;
  supportedGenerationMethods: string[];
}

// Cache model metadata for the process lifetime
let modelCache: GeminiModel[] | null = null;

/**
 * Fetches a resource with exponential backoff retry logic.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      // Only retry on 5xx errors or rate limits (429)
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
      
      console.warn(`Gemini API attempt ${i + 1} failed with status ${response.status}. Retrying...`);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini API attempt ${i + 1} encountered an error:`, err);
    }
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
  }
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Lists available models from the Gemini API.
 */
export async function listModels(): Promise<GeminiModel[]> {
  if (modelCache) return modelCache;

  const res = await fetch(
    `${BASE_URL}/${API_VERSION}/models?key=${process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`
  );

  if (!res.ok) {
    throw new GeminiError(
      `ListModels failed: ${res.status}`,
      res.status,
      await res.text()
    );
  }

  const data = await res.json();
  modelCache = data.models ?? [];
  return modelCache!;
}

/**
 * Resolves a preferred model name to a specific model ID available in the environment.
 */
export async function resolveModel(preferred: string): Promise<string> {
  const models = await listModels();

  // Try exact match first, then prefix match (handles versioned suffixes)
  const match =
    models.find(
      (m) =>
        m.name === `models/${preferred}` &&
        m.supportedGenerationMethods.includes("generateContent")
    ) ??
    models.find(
      (m) =>
        m.name.startsWith(`models/${preferred}`) &&
        m.supportedGenerationMethods.includes("generateContent")
    );

  if (!match) {
    const available = models
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => m.name);
    throw new GeminiError(
      `Model "${preferred}" not available. Available: ${available.join(", ")}`,
      404
    );
  }

  // Return just the model ID (strip "models/" prefix)
  return match.name.replace("models/", "");
}

/**
 * Generates content using the Gemini API.
 */
export async function generateContent(
  prompt: string,
  preferredModel = "gemini-1.5-flash"
): Promise<string> {
  const modelId = await resolveModel(preferredModel);

  const url = `${BASE_URL}/${API_VERSION}/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new GeminiError(
      errBody?.error?.message ?? `generateContent failed: ${res.status}`,
      res.status,
      errBody
    );
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
