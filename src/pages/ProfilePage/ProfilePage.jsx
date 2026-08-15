import { useState } from "react";
import { useSession } from "../../context/SessionContext";
import { IconProfile, IconChevronDown } from "../../components/icons/Icons";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, profile, buildings, saveProfile, signOutUser } = useSession();
  const displayName = profile?.full_name || user?.name || "";
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(profile?.phone_number || "");
  const [status, setStatus] = useState(""); // "" | "saving" | "saved" | "error"

  const handleDormChange = (e) => {
    saveProfile({ building: e.target.value });
  };

  const showStatus = (result) => {
    if (result.success) {
      setStatus("saved");
      window.setTimeout(() => setStatus(""), 1500);
    } else {
      setStatus("error");
    }
  };

  const handleNameBlur = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      // full_name gates access past onboarding — never save it blank.
      setName(displayName);
      return;
    }
    if (trimmed === displayName) return;
    setStatus("saving");
    showStatus(await saveProfile({ name: trimmed }));
  };

  const handlePhoneBlur = async () => {
    const trimmed = phone.trim();
    if (trimmed === (profile?.phone_number || "")) return;
    setStatus("saving");
    showStatus(await saveProfile({ phone: trimmed }));
  };

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__avatar">
          <IconProfile />
        </div>
        <div>
          <h2 className="profile-page__name">{displayName}</h2>
          <p className="meta-text profile-page__email">{user.email}</p>
        </div>
      </div>

      <div className="profile-page__field">
        <label htmlFor="name-input">Name</label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
      </div>

      <div className="profile-page__field">
        <label htmlFor="dorm-select">Dorm building</label>
        {buildings.length > 0 ? (
          <div className="profile-page__select-wrap">
            <select
              id="dorm-select"
              value={profile?.building_id || ""}
              onChange={handleDormChange}
            >
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
            <IconChevronDown className="profile-page__select-icon" />
          </div>
        ) : (
          <p className="meta-text">No buildings set up yet.</p>
        )}
      </div>

      <div className="profile-page__field">
        <label htmlFor="phone-input">Phone</label>
        <input
          id="phone-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={handlePhoneBlur}
        />
      </div>

      {status === "saving" && <p className="meta-text profile-page__status">Saving…</p>}
      {status === "saved" && <p className="meta-text profile-page__status profile-page__status--ok">Saved</p>}
      {status === "error" && (
        <p className="meta-text profile-page__status profile-page__status--error">
          Couldn't save — try again.
        </p>
      )}

      <button type="button" className="profile-page__signout" onClick={signOutUser}>
        Sign out
      </button>
    </div>
  );
}
