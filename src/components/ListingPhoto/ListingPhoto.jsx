import "./ListingPhoto.css";

// Stand-in for a real listing photo until Storage/Gemini vision is wired up.
// Renders like a printed photo window on a shipping label.
export default function ListingPhoto({ tone = "kraft", label, className = "" }) {
  return (
    <div className={`listing-photo listing-photo--${tone} ${className}`}>
      <span className="listing-photo__label meta-text">{label}</span>
    </div>
  );
}
