import "./Header.css";

export default function Header() {
  return (
    <header className="app-header">
      <span className="app-header__logo">
        Dorm<span className="app-header__logo-accent">Dash</span>
      </span>
      <span className="app-header__tagline meta-text">KEEP IT ON CAMPUS</span>
    </header>
  );
}
