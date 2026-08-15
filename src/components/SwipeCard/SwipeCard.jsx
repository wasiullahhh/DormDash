import { useRef, useState } from "react";
import ListingPhoto from "../ListingPhoto/ListingPhoto";
import { IconMapPin } from "../icons/Icons";
import "./SwipeCard.css";

const SWIPE_THRESHOLD = 110;
const EXIT_DISTANCE = 600;
const DRAG_ENGAGE_DISTANCE = 6;

export default function SwipeCard({
  listing,
  isTop,
  onSwipe,
  onExpand,
}) {
  const cardRef = useRef(null);
  const dragState = useRef({ startX: 0, startY: 0, tracking: false, dragging: false });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [exiting, setExiting] = useState(null); // "left" | "right" | null

  const triggerSwipe = (direction) => {
    setExiting(direction);
    setDrag({ x: direction === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE, y: drag.y });
    window.setTimeout(() => onSwipe(listing.id, direction), 220);
  };

  const handlePointerDown = (e) => {
    if (!isTop) return;
    // Don't capture yet — a plain tap (e.g. on the info button) must still
    // reach its target. Capture only kicks in once real dragging starts,
    // see handlePointerMove.
    dragState.current = { startX: e.clientX, startY: e.clientY, tracking: true, dragging: false };
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.tracking) return;
    const x = e.clientX - dragState.current.startX;
    const y = e.clientY - dragState.current.startY;

    if (!dragState.current.dragging) {
      if (Math.hypot(x, y) < DRAG_ENGAGE_DISTANCE) return;
      dragState.current.dragging = true;
      cardRef.current?.setPointerCapture(e.pointerId);
    }

    setDrag({ x, y });
  };

  const handlePointerUp = (e) => {
    const wasDragging = dragState.current.dragging;
    dragState.current.tracking = false;
    dragState.current.dragging = false;
    if (!wasDragging) return;

    if (cardRef.current?.hasPointerCapture(e.pointerId)) {
      cardRef.current.releasePointerCapture(e.pointerId);
    }
    if (Math.abs(drag.x) > SWIPE_THRESHOLD) {
      triggerSwipe(drag.x > 0 ? "right" : "left");
    } else {
      setDrag({ x: 0, y: 0 });
    }
  };

  const rotation = drag.x / 18;
  const stampOpacity = Math.min(Math.abs(drag.x) / SWIPE_THRESHOLD, 1);
  const isDragging = dragState.current.dragging || exiting;

  return (
    <article
      ref={cardRef}
      className={`swipe-card${isTop ? " swipe-card--top" : " swipe-card--behind"}`}
      style={{
        transform: isTop
          ? `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`
          : undefined,
        transition: isDragging ? "none" : "transform 0.35s cubic-bezier(.2,.8,.2,1)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="swipe-card__corner stamp-badge">{listing.category}</div>

      {isTop && (
        <>
          <div
            className="swipe-card__stamp swipe-card__stamp--keep"
            style={{ opacity: drag.x > 0 ? stampOpacity : 0 }}
          >
            Kept on Campus
          </div>
          <div
            className="swipe-card__stamp swipe-card__stamp--pass"
            style={{ opacity: drag.x < 0 ? stampOpacity : 0 }}
          >
            Passed
          </div>
        </>
      )}

      <ListingPhoto
        src={listing.photoUrl}
        tone={listing.photoTone}
        label={listing.photoLabel}
        className="swipe-card__photo"
      />

      <div className="swipe-card__notch swipe-card__notch--left" />
      <div className="swipe-card__notch swipe-card__notch--right" />
      <hr className="perforation" />

      <button
        type="button"
        className="swipe-card__info"
        onClick={() => onExpand(listing)}
      >
        <div className="swipe-card__info-row">
          <h3 className="swipe-card__title">{listing.title}</h3>
          <span className="swipe-card__price meta-text">${listing.price}</span>
        </div>
        <p className="swipe-card__meta meta-text">
          <IconMapPin /> {listing.dorm} · Rm {listing.room} · {listing.condition}
        </p>
      </button>
    </article>
  );
}
