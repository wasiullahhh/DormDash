import { createContext, useContext, useMemo, useState } from "react";
import {
  CURRENT_USER,
  MOCK_LISTINGS,
  MOCK_SAVED_LISTING_IDS,
  MOCK_SWIPE_HISTORY,
} from "../lib/mockData";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(CURRENT_USER);
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [dormScope, setDormScope] = useState("mine"); // "mine" | "all"
  const [swipeHistory, setSwipeHistory] = useState(MOCK_SWIPE_HISTORY);
  const [savedListingIds, setSavedListingIds] = useState(
    new Set(MOCK_SAVED_LISTING_IDS)
  );

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
      listings,
      addListing,
      dormScope,
      setDormScope,
      swipeHistory,
      recordSwipe,
      savedListingIds,
      toggleSaved,
    }),
    [user, listings, dormScope, swipeHistory, savedListingIds]
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
