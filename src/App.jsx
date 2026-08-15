import { useState } from "react";
import Header from "./components/Header/Header";
import LoginPage from "./pages/LoginPage/LoginPage";
import { useSession } from "./context/SessionContext";
import BottomNav from "./components/BottomNav/BottomNav";
import SwipeFeedPage from "./pages/SwipeFeedPage/SwipeFeedPage";
import MyDormPage from "./pages/MyDormPage/MyDormPage";
import PostItemPage from "./pages/PostItemPage/PostItemPage";
import SavedPage from "./pages/SavedPage/SavedPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ListingDetailPage from "./pages/ListingDetailPage/ListingDetailPage";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("swipe");
  const [expandedListing, setExpandedListing] = useState(null);
  const { user } = useSession();

  return (
    <div className="app-shell">
      <Header onLoginClick={() => setShowLogin(true)} />

      {user ? (
        <>
          <main className="app-main">
            {activeTab === "swipe" && <SwipeFeedPage onExpand={setExpandedListing} />}
            {activeTab === "dorm" && <MyDormPage onExpand={setExpandedListing} />}
            {activeTab === "post" && <PostItemPage onPosted={() => setActiveTab("dorm")} />}
            {activeTab === "saved" && <SavedPage onExpand={setExpandedListing} />}
            {activeTab === "profile" && <ProfilePage />}
          </main>

          <BottomNav activeTab={activeTab} onChange={setActiveTab} />

          {expandedListing && (
            <ListingDetailPage
              listing={expandedListing}
              onClose={() => setExpandedListing(null)}
            />
          )}
        </>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
