import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  MOCK_LISTINGS,
  MOCK_SAVED_LISTING_IDS,
  MOCK_SWIPE_HISTORY,
} from "../lib/mockData";
import { supabase } from "../lib/supabase";

const SessionContext = createContext(null);

// Supabase only knows email/password/metadata — these fields aren't
// persisted anywhere yet (no profiles table). TODO: once one exists,
// hydrate these from it instead of defaulting on every session.
function toAppUser(authUser) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email.split("@")[0],
    dorm: "",
    room: "",
    interests: [],
    sustainabilityScore: 0,
    joined: (authUser.created_at || "").slice(0, 10),
  };
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [dormScope, setDormScope] = useState("mine"); // "mine" | "all"
  const [swipeHistory, setSwipeHistory] = useState(MOCK_SWIPE_HISTORY);
  const [savedListingIds, setSavedListingIds] = useState(
    new Set(MOCK_SAVED_LISTING_IDS)
  );

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(toAppUser(data.session?.user));
      })
      .catch((err) => {
        // A bad URL/key or network hiccup here must not leave the app
        // stuck rendering nothing forever — fall back to logged-out.
        console.error("Supabase getSession failed:", err);
        setUser(null);
      })
      .finally(() => setAuthReady(true));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAppUser(session?.user));
    });

    return () => subscription.subscription.unsubscribe();
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
    const appUser = toAppUser(data.user);
    setUser(appUser);
    return { success: true, user: appUser };
  };

  const signInUser = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    const appUser = toAppUser(data.user);
    setUser(appUser);
    return { success: true, user: appUser };
  };

  const signOutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
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

  const addListing = (listing) => {
    setListings((prev) => [listing, ...prev]);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      authReady,
      listings,
      addListing,
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
    [user, authReady, listings, dormScope, swipeHistory, savedListingIds]
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
