import { useEffect, useState } from "react";
import "./OnboardingPage.css";
import { useSession } from "../../context/SessionContext";

export default function OnboardingPage() {
  const { user, buildings, saveProfile, signOutUser } = useSession();
  const [name, setName] = useState(user?.name || "");
  const [dorm, setDorm] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // buildings loads async (fetched from Supabase) — default the picker
  // to the first one once it arrives.
  useEffect(() => {
    if (!dorm && buildings.length > 0) {
      setDorm(buildings[0].building_id);
    }
  }, [buildings, dorm]);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await saveProfile({
        name: name.trim(),
        building: dorm || undefined,
        phone: phone.trim(),
      });
      if (!res.success) {
        setError(res.error || "Couldn't save your profile — try again.");
        return;
      }
      if (res.dropped?.length > 0) {
        // Save still succeeded for the fields that exist — just let them
        // know something didn't stick, rather than pretending it's all saved.
        setNotice(`Saved — note: ${res.dropped.join(", ")} couldn't be stored yet.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <span className="stamp-badge onboarding-stamp">Welcome to Campus</span>
        <h2 className="onboarding-title">Set up your profile</h2>
        <p className="onboarding-subtitle">
          A few details so your dorm mates know who they're trading with.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label className="onboarding-label">
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="onboarding-label">
            Dorm building
            {buildings.length > 0 ? (
              <select value={dorm} onChange={(e) => setDorm(e.target.value)}>
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="onboarding-empty-note meta-text">
                No buildings set up yet — you can add this later from Profile.
              </span>
            )}
          </label>

          <label className="onboarding-label">
            Phone number <span className="onboarding-optional">(optional)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          {error && <div className="onboarding-error">{error}</div>}
          {notice && <div className="onboarding-notice">{notice}</div>}

          <button type="submit" className="onboarding-submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save and continue"}
          </button>
        </form>

        <button type="button" className="onboarding-signout" onClick={signOutUser}>
          Wrong account? Sign out
        </button>
      </div>
    </div>
  );
}
