import { createContext, useContext, useMemo, useState } from "react";
import {
  MOCK_LISTINGS,
  MOCK_SAVED_LISTING_IDS,
  MOCK_SWIPE_HISTORY,
} from "../lib/mockData";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [dormScope, setDormScope] = useState("mine"); // "mine" | "all"
  const [swipeHistory, setSwipeHistory] = useState(MOCK_SWIPE_HISTORY);
  const [savedListingIds, setSavedListingIds] = useState(
    new Set(MOCK_SAVED_LISTING_IDS)
  );

  // Simple mock user store persisted to localStorage so registered users
  // must create an account before they can sign in.
  const USERS_KEY = "dormdash_mock_users";
  const initialUsers = (() => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  })();

  const [users, setUsers] = useState(initialUsers);

  function persistUsers(next) {
    setUsers(next);
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  }

  const registerUser = ({ email, password, name = "" }) => {
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: "An account with that email already exists." };
    }
    const newUser = {
      id: `u-${Math.floor(Math.random() * 100000)}`,
      name: name || email.split("@")[0],
      email,
      password,
      dorm: "",
      room: "",
      interests: [],
      sustainabilityScore: 0,
      joined: new Date().toISOString().slice(0, 10),
    };
    const next = [...users, newUser];
    persistUsers(next);
    return { success: true, user: newUser };
  };

  const signInUser = ({ email, password }) => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, error: "No account found for that email. Please create an account." };
    }
    if (found.password !== password) {
      return { success: false, error: "Incorrect password." };
    }
    return { success: true, user: found };
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
      users,
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
