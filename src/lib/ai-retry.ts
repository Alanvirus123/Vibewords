/**
 * @fileOverview Utility to handle AI API retries with exponential backoff.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an AI-related function with a retry loop specifically for rate limit errors.
 * 
 * @param apiCallFunction - The async function to execute.
 * @param maxRetries - Maximum number of retry attempts. Defaults to 3.
 * @returns The result of the apiCallFunction.
 * @throws The last error encountered if it's not a rate limit error or if maxRetries is reached.
 */
export async function runWithRetry<T>(apiCallFunction: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to execute the AI function
      return await apiCallFunction();
    } catch (error: any) {
      // Check if it's the specific 429 Resource Exhausted error
      const isRateLimit =
        error.message?.includes('429') ||
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.status === 429;

      if (isRateLimit && attempt < maxRetries - 1) {
        // Wait 2s, 4s, 8s...
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Hit the Gemini rate limit! Retrying in ${waitTime / 1000} seconds (Attempt ${attempt + 1})...`);
        await delay(waitTime);
      } else {
        // If it's a different error or we've run out of retries, throw it
        throw error;
      }
    }
  }

  // Fallback error if loop finishes without success (should be covered by throw in loop)
  throw new Error("The AI is a bit overwhelmed right now. Please try again in a minute!");
}
