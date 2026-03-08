
import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini-client";
import { GeminiError } from "@/lib/gemini-error";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const text = await generateContent(prompt);
    return NextResponse.json({ text });

  } catch (err) {
    if (err instanceof GeminiError) {
      console.error("[gemini]", {
        status: err.statusCode,
        message: err.message,
        raw: err.raw,
      });

      if (err.isNotFound()) {
        return NextResponse.json(
          { error: "AI model temporarily unavailable. Please try again shortly." },
          { status: 503 }
        );
      }
      if (err.isAuthError()) {
        return NextResponse.json({ error: "API configuration error." }, { status: 500 });
      }
    }

    console.error("[gemini] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
