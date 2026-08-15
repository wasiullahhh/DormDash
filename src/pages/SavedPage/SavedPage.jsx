import { useSession } from "../../context/SessionContext";
import ListingGridItem from "../../components/ListingGridItem/ListingGridItem";
import { IconSaved } from "../../components/icons/Icons";
import "./SavedPage.css";

export default function SavedPage({ onExpand }) {
  const { listings, savedListingIds } = useSession();
  const saved = listings.filter((l) => savedListingIds.has(l.id));

  return (
    <div className="saved-page">
      <header className="saved-page__header">
        <h2>Saved</h2>
        <p className="meta-text saved-page__count">
          {saved.length} item{saved.length === 1 ? "" : "s"} kept
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="saved-page__empty">
          <IconSaved className="saved-page__empty-icon" />
          <p>Nothing saved yet — swipe right on something you want.</p>
        </div>
      ) : (
        <div className="saved-page__grid">
          {saved.map((listing) => (
            <ListingGridItem key={listing.id} listing={listing} onExpand={onExpand} />
          ))}
        </div>
      )}
    </div>
  );
}
