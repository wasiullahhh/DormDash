import "./ListingPhoto.css";

// Renders a real listing photo when one exists (uploaded to Supabase
// Storage). Falls back to a colored placeholder with a printed-label
// look for listings without a photo.
export default function ListingPhoto({ src, tone = "kraft", label, className = "" }) {
  if (src) {
    return (
      <div className={`listing-photo listing-photo--image ${className}`}>
        <img src={src} alt={label || ""} className="listing-photo__img" />
      </div>
    );
  }

  return (
    <div className={`listing-photo listing-photo--${tone} ${className}`}>
      <span className="listing-photo__label meta-text">{label}</span>
    </div>
  );
}
