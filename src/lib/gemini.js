// Gemini API wrapper. curateListings and parseListingFromPhoto call the
// real Gemini API using structured JSON output (responseSchema) so the
// UI never has to parse free text. generateDigest is still a stub — see
// its own comment below.
//
// SECURITY NOTE: VITE_GEMINI_API_KEY is bundled into client-side JS and
// is visible to anyone who opens dev tools, same as the Supabase key.
// Unlike the Supabase key, there's no RLS-equivalent backstop here — set
// a spending cap / API restriction on the key in Google AI Studio, and
// before this goes past the hackathon, proxy these calls through a
// server (e.g. a Supabase Edge Function) instead of calling from the browser.

import { CATEGORIES } from "./mockData";

// "-latest" alias, not a pinned version — Google deprecates pinned flash
// models for new API keys surprisingly fast (confirmed: gemini-2.5-flash
// and gemini-2.5-flash-lite both 404 "no longer available to new users"
// as of Aug 2026, despite still being listed by the models.list endpoint).
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CONDITIONS = ["New", "Like new", "Good", "Fair", "Poor"];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function callGemini({ parts, responseSchema }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing — add VITE_GEMINI_API_KEY to .env and restart the dev server.");
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}

/**
 * Rank a pool of listings for a given user's swipe feed, inferring taste
 * from what they've swiped right/left on so far (there's no separate
 * "interests" field in the schema — swipe history is the real signal).
 *
 * @param {object} userProfile - the signed-in user (at least { name })
 * @param {object[]} listings - pool of active listings to rank
 * @param {{listingId: string, direction: "left"|"right"}[]} swipeHistory
 * @returns {Promise<{listingId: string, relevanceScore: number, reason: string}[]>}
 */
export async function curateListings(userProfile, listings, swipeHistory = []) {
  if (listings.length === 0) return [];

  const titleFor = (id) => listings.find((l) => l.id === id)?.title;
  const liked = swipeHistory.filter((s) => s.direction === "right").map((s) => titleFor(s.listingId)).filter(Boolean);
  const passed = swipeHistory.filter((s) => s.direction === "left").map((s) => titleFor(s.listingId)).filter(Boolean);

  const prompt = `You are ranking dorm marketplace listings for a swipe-style feed on DormDash.
User: ${userProfile?.name || "a student"}.
Items they've liked (swiped right) so far: ${liked.length ? liked.join(", ") : "none yet"}.
Items they've passed on (swiped left) so far: ${passed.length ? passed.join(", ") : "none yet"}.

Infer their taste from likes/passes and rank the listings below by relevance to them, most relevant first.
If there's no history yet, rank by general appeal instead (useful items, good condition, reasonable price).
Return every listing exactly once.

Listings:
${listings
  .map((l) => `- id: ${l.id} | title: "${l.title}" | category: ${l.category} | price: $${l.price} | condition: ${l.condition} | description: "${l.description}"`)
  .join("\n")}`;

  try {
    return await callGemini({
      parts: [{ text: prompt }],
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            listingId: { type: "string", enum: listings.map((l) => l.id) },
            relevanceScore: { type: "number" },
            reason: { type: "string" },
          },
          required: ["listingId", "relevanceScore", "reason"],
        },
      },
    });
  } catch (err) {
    // The swipe feed is the core loop of the app — a ranking failure
    // shouldn't take it down. Fall back to the pool's natural order.
    console.error("Gemini curateListings failed, falling back to default order:", err.message);
    return listings.map((l, i) => ({
      listingId: l.id,
      relevanceScore: 1 - i / listings.length,
      reason: "Default order (AI ranking unavailable)",
    }));
  }
}

/**
 * Turn a listing photo + loose voice-to-text description into a clean,
 * structured listing draft.
 *
 * @param {File|Blob|null} imageFile - the uploaded/captured photo
 * @param {string} voiceText - raw spoken/typed description
 * @returns {Promise<{title: string, description: string, category: string, condition: string, suggestedPriceRange: {min: number, max: number}, tags: string[]}>}
 */
export async function parseListingFromPhoto(imageFile, voiceText) {
  const trimmedText = (voiceText || "").trim();
  if (!imageFile && !trimmedText) {
    throw new Error("Add a photo or a description first.");
  }

  const parts = [
    {
      text: `You're helping a college student list an item for sale/giveaway on a dorm move-in/move-out marketplace app called DormDash.
${imageFile ? "Look at the attached photo of the item." : ""}
${trimmedText ? `Here's what they said about it (may be a messy voice-to-text transcript): "${trimmedText}"` : ""}

Write a clean, appealing listing based on this.
- category must be exactly one of: ${CATEGORIES.join(", ")}
- condition must be exactly one of: ${CONDITIONS.join(", ")}
- suggest a fair secondhand price range in USD for a college dorm marketplace
- title under 60 characters
- description under 400 characters, friendly and specific
- 2-4 short lowercase tags`,
    },
  ];

  if (imageFile) {
    const base64 = await fileToBase64(imageFile);
    parts.push({ inlineData: { mimeType: imageFile.type || "image/jpeg", data: base64 } });
  }

  return callGemini({
    parts,
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string", enum: CATEGORIES },
        condition: { type: "string", enum: CONDITIONS },
        suggestedPriceRange: {
          type: "object",
          properties: {
            min: { type: "number" },
            max: { type: "number" },
          },
          required: ["min", "max"],
        },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "description", "category", "condition", "suggestedPriceRange", "tags"],
    },
  });
}

/**
 * Build a short "you might want this" digest based on swipe history and
 * stated needs, for periodic re-engagement prompts. STILL A STUB — no
 * screen calls this yet, so it hasn't been wired to the real API.
 *
 * @param {object} userProfile
 * @param {object[]} swipeHistory - [{ listingId, direction, at }]
 * @param {object[]} listings - current active listing pool
 * @returns {Promise<{headline: string, listingIds: string[]}>}
 */
export async function generateDigest(userProfile, swipeHistory, listings) {
  const likedIds = new Set(
    swipeHistory.filter((s) => s.direction === "right").map((s) => s.listingId)
  );
  const remaining = listings.filter((l) => !likedIds.has(l.id)).slice(0, 3);

  return {
    headline:
      remaining.length > 0
        ? `${remaining.length} new picks based on what you've kept`
        : "You're all caught up",
    listingIds: remaining.map((l) => l.id),
  };
}
