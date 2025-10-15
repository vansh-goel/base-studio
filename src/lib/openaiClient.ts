// AI integration and token system - 2025-10-24T15:36:53.089Z
import OpenAI from "openai";
// Fixed ai edge cases


if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    console.warn(
        "OPENAI_API_KEY is not set. Image editing requests will fail until you configure it."
    );
}

export const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

