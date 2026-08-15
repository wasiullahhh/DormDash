import ListingPhoto from "../ListingPhoto/ListingPhoto";
import "./ListingGridItem.css";

export default function ListingGridItem({ listing, onExpand }) {
  return (
    <button type="button" className="grid-item" onClick={() => onExpand(listing)}>
      <ListingPhoto
        src={listing.photoUrl}
        tone={listing.photoTone}
        label={listing.photoLabel}
        className="grid-item__photo"
      />
      <div className="grid-item__body">
        <p className="grid-item__title">{listing.title}</p>
        <p className="grid-item__meta meta-text">
          ${listing.price} · {listing.dorm.split(" ")[0]}
        </p>
      </div>
    </button>
  );
}
