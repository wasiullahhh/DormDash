import { useSession } from "../../context/SessionContext";
import { IconProfile, IconChevronDown } from "../../components/icons/Icons";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, profile, buildings, saveProfile, signOutUser } = useSession();

  const handleDormChange = (e) => {
    saveProfile({ building: e.target.value });
  };

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__avatar">
          <IconProfile />
        </div>
        <div>
          <h2 className="profile-page__name">{user.name}</h2>
          <p className="meta-text profile-page__email">{user.email}</p>
        </div>
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
        <input id="phone-input" type="text" value={profile?.phone_number || ""} readOnly />
      </div>

      <button type="button" className="profile-page__signout" onClick={signOutUser}>
        Sign out
      </button>
    </div>
  );
}
