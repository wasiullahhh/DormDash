import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_SAVED_LISTING_IDS, MOCK_SWIPE_HISTORY } from "../lib/mockData";
import { supabase } from "../lib/supabase";

const SessionContext = createContext(null);

// Category -> placeholder tone, used only when a listing has no uploaded
// photo yet (ListingPhoto falls back to this "printed label" look).
const CATEGORY_TONES = {
  Electronics: "navy",
  Kitchen: "navy",
  Furniture: "stamp",
  Clothing: "stamp",
  Decor: "forest",
  Books: "forest",
  Storage: "kraft",
  Misc: "kraft",
};

// Maps a raw `listings` row (with seller/building joined in) to the shape
// every listing-consuming component already expects (SwipeCard,
// ListingGridItem, ListingDetailPage, MyDormPage...). Keeping this shape
// stable means those components don't need to change as the data source
// moves from mock to real.
function mapListingRow(row) {
  return {
    id: row.listing_id,
    title: row.title,
    description: row.description || "",
    category: row.category || "Misc",
    condition: row.condition || "Good",
    price: row.price ?? 0,
    photoUrl: row.photos?.[0] || null,
    photoTone: CATEGORY_TONES[row.category] || "kraft",
    photoLabel: (row.category || "Misc").toUpperCase(),
    dorm: row.building?.name || "Unknown Building",
    buildingId: row.building_id,
    room: row.pickup_location || "",
    seller: { id: row.seller_id, name: row.seller?.full_name || "A student" },
    tags: [],
    postedAt: (row.created_at || "").slice(0, 10),
  };
}

// Supabase Auth only knows email/password/metadata. Everything else
// (full_name, phone_number, building_id...) lives in the "users" table
// and is loaded separately into `profile` — see establishSession below.
function toAppUser(authUser) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email.split("@")[0],
  };
}

// Ensures a row exists in the public "users" table for this authenticated
// person. Only writes columns we're sure exist (user_id, email) —
// everything else is left for the onboarding form / saveProfile to fill
// in later. `user_id` matches auth.uid(), per the table's "own profile"
// RLS policies — if this errors with a column/constraint message, that's
// the thing to check first.
async function syncUserRow(authUser) {
  const { error } = await supabase
    .from("users")
    .upsert({ user_id: authUser.id, email: authUser.email }, { onConflict: "user_id" });
  if (error) {
    console.error("Failed to sync users table:", error.message);
  }
}

// PostgREST's "unknown column" message looks like:
//   Could not find the 'name' column of 'users' in the schema cache
// Pull the column name out of it so callers can drop just that key and
// retry, instead of failing the whole write over one uncertain column.
function extractUnknownColumn(error) {
  return /'([^']+)' column/.exec(error?.message || "")?.[1] ?? null;
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [listings, setListings] = useState([]);
  const [dormScope, setDormScope] = useState("mine"); // "mine" | "all"
  const [swipeHistory, setSwipeHistory] = useState(MOCK_SWIPE_HISTORY);
  const [savedListingIds, setSavedListingIds] = useState(
    new Set(MOCK_SAVED_LISTING_IDS)
  );

  // Buildings are public reference data (not tied to a session) — load
  // once on mount regardless of auth state, for the dorm picker.
  useEffect(() => {
    supabase
      .from("buildings")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load buildings:", error.message);
          return;
        }
        setBuildings(data || []);
      });
  }, []);

  // Listings are public read data too (RLS, if any, should allow
  // authenticated SELECT — same pattern as `users`). Loaded once on mount
  // and re-loaded via refreshListings() after posting a new one, so a
  // freshly-posted item shows up without a full page reload.
  const refreshListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*, seller:users!seller_id(full_name), building:buildings!building_id(name)")
      .eq("status", "available")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load listings:", error.message);
      return;
    }
    setListings((data || []).map(mapListingRow));
  };

  useEffect(() => {
    refreshListings();
  }, []);

  // Single entry point for "we now have (or lost) an authenticated user."
  // Keeps `user` (identity) and `profile` (the users-table row) in sync
  // no matter whether the session came from a fresh sign-in, a sign-up,
  // or a restored session on page load.
  const establishSession = async (authUser) => {
    setUser(toAppUser(authUser));
    if (!authUser) {
      setProfile(null);
      return;
    }
    await syncUserRow(authUser);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (error) {
      console.error("Failed to load profile row:", error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => establishSession(data.session?.user))
      .catch((err) => {
        // A bad URL/key or network hiccup here must not leave the app
        // stuck rendering nothing forever — fall back to logged-out.
        console.error("Supabase getSession failed:", err);
        setUser(null);
        setProfile(null);
      })
      .finally(() => setAuthReady(true));

    // Runs on every session change — explicit sign-in/sign-up, a restored
    // session on page load, token refresh, etc. — so the users-table row
    // gets created/kept in sync no matter how the session came to exist.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      establishSession(session?.user);
    });

    return () => subscription.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerUser = async ({ email, password, name = "" }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    if (!data.session) {
      return {
        success: false,
        error: "Account created — check your email to confirm before signing in.",
      };
    }
    await establishSession(data.user);
    return { success: true };
  };

  const signInUser = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    await establishSession(data.user);
    return { success: true };
  };

  const signOutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Writes onboarding/profile fields to the users table. `building` must
  // be a real buildings.building_id (uuid) — not a dorm name — since
  // users.building_id is a foreign key. full_name/building_id/phone_number
  // are attempted; if a column turns out not to exist, that key is dropped
  // from the write and the rest still saves rather than failing the whole
  // update over one bad column.
  const saveProfile = async ({ name, building, phone }) => {
    if (!user) return { success: false, error: "Not signed in." };

    const remaining = {};
    if (name !== undefined) remaining.full_name = name;
    if (building !== undefined) remaining.building_id = building;
    if (phone !== undefined) remaining.phone_number = phone;

    const dropped = [];
    let lastError = null;

    while (Object.keys(remaining).length > 0) {
      const { error } = await supabase.from("users").update(remaining).eq("user_id", user.id);
      if (!error) {
        lastError = null;
        break;
      }
      const badColumn = extractUnknownColumn(error);
      if (badColumn && badColumn in remaining) {
        dropped.push(badColumn);
        delete remaining[badColumn];
        continue;
      }
      lastError = error;
      break;
    }

    // The name has nowhere else to live in this app — if the users table
    // doesn't have that column, keep it in Auth metadata instead of
    // silently losing what the person typed.
    if (dropped.includes("full_name") && name !== undefined) {
      await supabase.auth.updateUser({ data: { name } });
      setUser((prev) => (prev ? { ...prev, name } : prev));
    }

    if (lastError) {
      return { success: false, error: lastError.message, dropped };
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!fetchError) setProfile(data);

    return { success: true, dropped };
  };

  const recordSwipe = (listingId, direction) => {
    setSwipeHistory((prev) => [
      ...prev,
      { listingId, direction, at: new Date().toISOString() },
    ]);
    if (direction === "right") {
      setSavedListingIds((prev) => new Set(prev).add(listingId));
    }
  };

  const toggleSaved = (listingId) => {
    setSavedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  };

  // full_name is required in the onboarding form and isn't sensitive, so
  // it's the "has this person finished onboarding" signal.
  const profileComplete = Boolean(profile?.full_name);

  const value = useMemo(
    () => ({
      user,
      profile,
      profileComplete,
      saveProfile,
      authReady,
      buildings,
      listings,
      refreshListings,
      dormScope,
      setDormScope,
      swipeHistory,
      recordSwipe,
      savedListingIds,
      toggleSaved,
      registerUser,
      signInUser,
      signOutUser,
    }),
    [user, profile, profileComplete, authReady, buildings, listings, dormScope, swipeHistory, savedListingIds]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
