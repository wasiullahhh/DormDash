// Gemini API wrapper — stubbed with typed mock responses so the UI can be
// built and tested before real API calls are wired in.
//
// Real implementation will call the Gemini API (gemini-1.5-flash or latest
// flash-tier model) using function calling / structured JSON output so
// responses don't need free-text parsing. Swap the stub bodies below for
// live `fetch`/SDK calls once VITE_GEMINI_API_KEY is wired up — the
// function signatures and return shapes are the contract the UI relies on.

const MOCK_LATENCY_MS = 500;

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rank/filter a pool of listings for a given user, simulating Gemini's
 * personalized curation for the swipe feed.
 *
 * @param {object} userProfile - { interests, dorm, swipeHistory, ... }
 * @param {object[]} listings - pool of active listings to rank
 * @returns {Promise<{listingId: string, relevanceScore: number, reason: string}[]>}
 */
export async function curateListings(userProfile, listings) {
  await delay();

  const interests = (userProfile?.interests || []).map((i) => i.toLowerCase());

  return listings
    .map((listing) => {
      const text = `${listing.title} ${listing.description} ${listing.category}`.toLowerCase();
      const matches = interests.filter((interest) => text.includes(interest.split(" ")[0]));
      const baseScore = 0.5 + matches.length * 0.15;
      const priceBoost = listing.price <= 20 ? 0.1 : 0;
      const relevanceScore = Math.min(1, Number((baseScore + priceBoost).toFixed(2)));

      return {
        listingId: listing.id,
        relevanceScore,
        reason:
          matches.length > 0
            ? `Matches your interest in "${matches[0]}"`
            : "General match for your dorm and price range",
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
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
  await delay(900);

  const cleanedText = (voiceText || "").trim();
  const firstSentence = cleanedText.split(/[.!?]/)[0] || "Dorm item";
  const title = firstSentence
    .replace(/^(um|uh|so|like|it's|its|this is)\s+/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 48);

  return {
    title: title || "Untitled Item",
    description:
      cleanedText.length > 0
        ? `${cleanedText.charAt(0).toUpperCase()}${cleanedText.slice(1)}`
        : "No description provided yet — add a few details about condition and why you're selling.",
    category: "Misc",
    condition: "Good",
    suggestedPriceRange: { min: 8, max: 25 },
    tags: cleanedText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 4),
  };
}

/**
 * Build a short "you might want this" digest based on swipe history and
 * stated needs, for periodic re-engagement prompts.
 *
 * @param {object} userProfile
 * @param {object[]} swipeHistory - [{ listingId, direction, at }]
 * @param {object[]} listings - current active listing pool
 * @returns {Promise<{headline: string, listingIds: string[]}>}
 */
export async function generateDigest(userProfile, swipeHistory, listings) {
  await delay();

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
