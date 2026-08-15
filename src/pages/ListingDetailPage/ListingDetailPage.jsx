import { useSession } from "../../context/SessionContext";
import ListingPhoto from "../../components/ListingPhoto/ListingPhoto";
import { IconBack, IconHeart, IconMapPin, IconTag } from "../../components/icons/Icons";
import "./ListingDetailPage.css";

export default function ListingDetailPage({ listing, onClose }) {
  const { user, savedListingIds, toggleSaved, recordSwipe } = useSession();
  const isSaved = savedListingIds.has(listing.id);
  const isOwnListing = listing.seller.id === user?.id;

  const handleWantIt = () => {
    if (!isSaved) {
      recordSwipe(listing.id, "right");
    } else {
      toggleSaved(listing.id);
    }
  };

  return (
    <div className="listing-detail" role="dialog" aria-modal="true">
      <button type="button" className="listing-detail__close" onClick={onClose} aria-label="Back">
        <IconBack />
      </button>

      <ListingPhoto
        src={listing.photoUrl}
        tone={listing.photoTone}
        label={listing.photoLabel}
        className="listing-detail__photo"
      />

      <div className="listing-detail__corner stamp-badge">{listing.category}</div>

      <div className="listing-detail__body">
        <div className="listing-detail__title-row">
          <h2>{listing.title}</h2>
          <span className="listing-detail__price meta-text">${listing.price}</span>
        </div>

        <p className="listing-detail__code meta-text">
          DD-{listing.id.replace(/\D/g, "").padStart(6, "0")} · POSTED {listing.postedAt}
        </p>

        <hr className="perforation" />

        <p className="listing-detail__description">{listing.description}</p>

        <div className="listing-detail__meta-grid">
          <div>
            <span className="listing-detail__meta-label">Condition</span>
            <span>{listing.condition}</span>
          </div>
          <div>
            <span className="listing-detail__meta-label">
              <IconMapPin /> Location
            </span>
            <span>
              {listing.dorm} · Rm {listing.room}
            </span>
          </div>
          <div>
            <span className="listing-detail__meta-label">Seller</span>
            <span>{listing.seller.name}</span>
          </div>
        </div>

        {listing.tags?.length > 0 && (
          <div className="listing-detail__tags">
            {listing.tags.map((tag) => (
              <span key={tag} className="listing-detail__tag meta-text">
                <IconTag /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="listing-detail__actions">
        {isOwnListing ? (
          <span className="listing-detail__own-notice stamp-badge">Your Listing</span>
        ) : (
          <>
            <button type="button" className="listing-detail__message">
              Message Seller
            </button>
            <button
              type="button"
              className={`listing-detail__want${isSaved ? " listing-detail__want--active" : ""}`}
              onClick={handleWantIt}
            >
              <IconHeart /> {isSaved ? "Kept" : "Want It"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
