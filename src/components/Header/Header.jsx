import "./Header.css";
import { useSession } from "../../context/SessionContext";

export default function Header() {
  const { user, signOutUser } = useSession();

  return (
    <header className="app-header">
      <span className="app-header__logo">
        Dorm<span className="app-header__logo-accent">Dash</span>
      </span>
      <span className="app-header__tagline meta-text">KEEP IT ON CAMPUS</span>

      {user && (
        <div className="app-header__user">
          <span className="app-header__user-name">{user.name}</span>
          <button
            className="app-header__login-btn"
            onClick={signOutUser}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
