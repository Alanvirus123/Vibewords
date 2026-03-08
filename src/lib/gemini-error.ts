/**
 * @fileOverview Custom error class for Gemini API interactions.
 */

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "GeminiError";
  }

  isNotFound() { return this.statusCode === 404; }
  isAuthError() { return this.statusCode === 401 || this.statusCode === 403; }
  isRateLimit() { return this.statusCode === 429; }
}
