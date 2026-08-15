import { useState } from "react";
import { useSession } from "../../context/SessionContext";
import { parseListingFromPhoto } from "../../lib/gemini";
import { CATEGORIES } from "../../lib/mockData";
import { IconCamera, IconMic, IconSparkle } from "../../components/icons/Icons";
import "./PostItemPage.css";

const emptyDraft = {
  title: "",
  description: "",
  category: "Misc",
  condition: "Good",
  price: "",
};

export default function PostItemPage({ onPosted }) {
  const { user, addListing } = useSession();
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [generating, setGenerating] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await parseListingFromPhoto(photoFile, voiceText);
    setDraft({
      title: result.title,
      description: result.description,
      category: result.category,
      condition: result.condition,
      price: result.suggestedPriceRange.min,
    });
    setGenerating(false);
  };

  const handleFieldChange = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addListing({
      id: `l-${Date.now()}`,
      title: draft.title || "Untitled Item",
      description: draft.description,
      category: draft.category,
      condition: draft.condition,
      price: Number(draft.price) || 0,
      dorm: user.dorm,
      room: user.room,
      seller: { id: user.id, name: user.name, dorm: user.dorm },
      tags: [],
      postedAt: new Date().toISOString().slice(0, 10),
      photoTone: "kraft",
      photoLabel: draft.category.slice(0, 8).toUpperCase(),
    });
    setPosted(true);
    setTimeout(() => {
      setPosted(false);
      setDraft(emptyDraft);
      setPhotoFile(null);
      setPhotoUrl(null);
      setVoiceText("");
      onPosted?.();
    }, 1100);
  };

  if (posted) {
    return (
      <div className="post-item post-item--confirm">
        <span className="stamp-badge post-item__confirm-stamp">Posted</span>
        <p>Your item is live for {user.dorm}.</p>
      </div>
    );
  }

  return (
    <form className="post-item" onSubmit={handleSubmit}>
      <h2 className="post-item__heading">Post an Item</h2>

      <label className="post-item__photo-upload">
        {photoUrl ? (
          <img src={photoUrl} alt="Item preview" className="post-item__photo-preview" />
        ) : (
          <span className="post-item__photo-placeholder">
            <IconCamera />
            <span>Add a photo</span>
          </span>
        )}
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="visually-hidden" />
      </label>

      <div className="post-item__field">
        <label htmlFor="voice-text">
          <IconMic /> Describe it (type or paste your voice note)
        </label>
        <textarea
          id="voice-text"
          rows={3}
          placeholder="e.g. um so it's a mini fridge, works great, moving out end of semester..."
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="post-item__generate"
        onClick={handleGenerate}
        disabled={generating || (!photoFile && !voiceText.trim())}
      >
        <IconSparkle /> {generating ? "Cleaning it up…" : "Generate listing with AI"}
      </button>

      <div className="post-item__field">
        <label htmlFor="title">Title</label>
        <input id="title" type="text" value={draft.title} onChange={handleFieldChange("title")} required />
      </div>

      <div className="post-item__field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          value={draft.description}
          onChange={handleFieldChange("description")}
        />
      </div>

      <div className="post-item__row">
        <div className="post-item__field">
          <label htmlFor="category">Category</label>
          <select id="category" value={draft.category} onChange={handleFieldChange("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="post-item__field">
          <label htmlFor="price">Price ($)</label>
          <input id="price" type="number" min="0" value={draft.price} onChange={handleFieldChange("price")} />
        </div>
      </div>

      <button type="submit" className="post-item__submit">
        Post to {user.dorm}
      </button>
    </form>
  );
}
