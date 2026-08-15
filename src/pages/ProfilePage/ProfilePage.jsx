import { useSession } from "../../context/SessionContext";
import { DORMS } from "../../lib/mockData";
import { IconProfile, IconChevronDown, IconSparkle } from "../../components/icons/Icons";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, setUser } = useSession();

  const handleDormChange = (e) => {
    setUser((prev) => ({ ...prev, dorm: e.target.value }));
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
        <div className="profile-page__select-wrap">
          <select id="dorm-select" value={user.dorm} onChange={handleDormChange}>
            {DORMS.map((dorm) => (
              <option key={dorm} value={dorm}>
                {dorm}
              </option>
            ))}
          </select>
          <IconChevronDown className="profile-page__select-icon" />
        </div>
      </div>

      <div className="profile-page__field">
        <label htmlFor="room-input">Room</label>
        <input id="room-input" type="text" value={user.room} readOnly />
      </div>

      <div className="profile-page__stat stamp-badge profile-page__stamp">
        <IconSparkle /> {user.sustainabilityScore} lbs kept out of landfill
      </div>

      <div className="profile-page__field">
        <span className="profile-page__label-static">Interests</span>
        <div className="profile-page__tags">
          {user.interests.map((interest) => (
            <span key={interest} className="profile-page__tag meta-text">
              {interest}
            </span>
          ))}
        </div>
      </div>

      <button type="button" className="profile-page__signout">
        Sign out
      </button>
    </div>
  );
}
