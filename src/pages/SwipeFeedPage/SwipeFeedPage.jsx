import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../context/SessionContext";
import { curateListings } from "../../lib/gemini";
import SwipeCard from "../../components/SwipeCard/SwipeCard";
import { IconHeart, IconX, IconSparkle } from "../../components/icons/Icons";
import "./SwipeFeedPage.css";

export default function SwipeFeedPage({ onExpand }) {
  const { user, listings, dormScope, setDormScope, recordSwipe } = useSession();
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const scopedListings = useMemo(
    () =>
      dormScope === "mine"
        ? listings.filter((l) => l.dorm === user.dorm)
        : listings,
    [listings, dormScope, user.dorm]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    curateListings(user, scopedListings).then((ranked) => {
      if (cancelled) return;
      setOrder(ranked.map((r) => r.listingId));
      setIndex(0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [scopedListings, user]);

  const stack = order
    .slice(index, index + 2)
    .map((id) => scopedListings.find((l) => l.id === id))
    .filter(Boolean);

  const handleSwipe = (listingId, direction) => {
    recordSwipe(listingId, direction);
    setIndex((i) => i + 1);
  };

  return (
    <div className="swipe-feed">
      <div className="swipe-feed__scope">
        <button
          type="button"
          className={`swipe-feed__scope-btn${dormScope === "mine" ? " swipe-feed__scope-btn--active" : ""}`}
          onClick={() => setDormScope("mine")}
        >
          My Dorm
        </button>
        <button
          type="button"
          className={`swipe-feed__scope-btn${dormScope === "all" ? " swipe-feed__scope-btn--active" : ""}`}
          onClick={() => setDormScope("all")}
        >
          All Dorms
        </button>
      </div>

      <div className="swipe-feed__stack">
        {loading ? (
          <div className="swipe-feed__empty">
            <IconSparkle className="swipe-feed__empty-icon" />
            <p className="meta-text">Curating your feed…</p>
          </div>
        ) : stack.length > 0 ? (
          stack
            .slice()
            .reverse()
            .map((listing, i) => (
              <SwipeCard
                key={listing.id}
                listing={listing}
                isTop={i === stack.length - 1}
                onSwipe={handleSwipe}
                onExpand={onExpand}
              />
            ))
        ) : (
          <div className="swipe-feed__empty">
            <span className="stamp-badge swipe-feed__empty-stamp">All Sorted</span>
            <p>You've seen everything in {dormScope === "mine" ? "your dorm" : "all dorms"} for now.</p>
          </div>
        )}
      </div>

      {stack.length > 0 && !loading && (
        <div className="swipe-feed__actions">
          <button
            type="button"
            className="swipe-feed__action swipe-feed__action--pass"
            aria-label="Pass"
            onClick={() => handleSwipe(stack[0].id, "left")}
          >
            <IconX />
          </button>
          <button
            type="button"
            className="swipe-feed__action swipe-feed__action--want"
            aria-label="Want it"
            onClick={() => handleSwipe(stack[0].id, "right")}
          >
            <IconHeart />
          </button>
        </div>
      )}
    </div>
  );
}
