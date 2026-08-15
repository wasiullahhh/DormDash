import {
  IconSwipe,
  IconDorm,
  IconPost,
  IconSaved,
  IconProfile,
} from "../icons/Icons";
import "./BottomNav.css";

const TABS = [
  { id: "swipe", label: "Swipe", Icon: IconSwipe },
  { id: "dorm", label: "My Dorm", Icon: IconDorm },
  { id: "post", label: "Post", Icon: IconPost },
  { id: "saved", label: "Saved", Icon: IconSaved },
  { id: "profile", label: "Profile", Icon: IconProfile },
];

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === activeTab;
        const isPost = id === "post";
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}${
              isPost ? " bottom-nav__item--post" : ""
            }`}
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav__icon">
              <Icon />
            </span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
