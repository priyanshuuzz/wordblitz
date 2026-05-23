// ── AI word helper via OpenRouter ─────────────────────────────────────────
// Uses OpenRouter's OpenAI-compatible API so any model (including Gemini)
// can be called with a standard fetch — no extra SDK needed.
//
// Set VITE_OPENROUTER_API_KEY in your .env file.
// The key format is: sk-or-v1-...
//
// Model used: google/gemini-2.0-flash-exp:free  (free tier on OpenRouter)
// Swap to any other model slug from https://openrouter.ai/models

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const MODEL = "google/gemini-2.0-flash-001";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface AIHintResult {
  words: string[];       // suggested words starting with the required letter
  explanation: string;   // brief reasoning
}

/**
 * Ask the AI for word suggestions that:
 *  - start with `startLetter`
 *  - belong to `category` (optional)
 *  - are not in `usedWords`
 *
 * Returns up to 5 suggestions. Falls back to empty array on error.
 */
export async function getAIWordHints(
  startLetter: string,
  usedWords: string[],
  category?: string
): Promise<AIHintResult> {
  if (!OPENROUTER_API_KEY) {
    return { words: [], explanation: "No API key configured." };
  }

  const categoryClause = category
    ? ` The words must be related to the theme: "${category}".`
    : "";

  const prompt = `You are helping a player in a word chain game.
Give me 5 English words that:
1. Start with the letter "${startLetter.toUpperCase()}"
2. Are common, real English words (min 3 letters)${categoryClause}
3. Are NOT any of these already-used words: ${usedWords.slice(-20).join(", ") || "none"}

Reply with ONLY a JSON object in this exact format, no markdown:
{"words":["word1","word2","word3","word4","word5"],"explanation":"one sentence why these are good"}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "WordBlitz",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn("[AI] OpenRouter error:", res.status, await res.text());
      return { words: [], explanation: "AI unavailable." };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Parse the JSON response
    const parsed = JSON.parse(content.trim()) as AIHintResult;
    return {
      words: (parsed.words ?? []).map((w: string) => w.toUpperCase()).slice(0, 5),
      explanation: parsed.explanation ?? "",
    };
  } catch (err) {
    console.warn("[AI] Failed to get hints:", err);
    return { words: [], explanation: "Could not reach AI." };
  }
}

/**
 * Ask the AI to validate whether a word fits a category.
 * Used as a secondary check in category mode when the local word list
 * doesn't contain the word but it might still be valid.
 */
export async function aiValidateCategoryWord(
  word: string,
  category: string
): Promise<{ valid: boolean; reason: string }> {
  if (!OPENROUTER_API_KEY) {
    return { valid: false, reason: "No API key configured." };
  }

  const prompt = `Is "${word}" a real word that belongs to the category "${category}"?
Reply with ONLY a JSON object, no markdown:
{"valid":true,"reason":"brief explanation"}
or
{"valid":false,"reason":"brief explanation"}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "WordBlitz",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return { valid: false, reason: "AI unavailable." };

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.trim());
  } catch {
    return { valid: false, reason: "Could not reach AI." };
  }
}
