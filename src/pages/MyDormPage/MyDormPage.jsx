import { useSession } from "../../context/SessionContext";
import ListingGridItem from "../../components/ListingGridItem/ListingGridItem";
import { IconDorm } from "../../components/icons/Icons";
import "./MyDormPage.css";

export default function MyDormPage({ onExpand }) {
  const { profile, buildings, listings } = useSession();
  const dormListings = listings.filter((l) => l.buildingId === profile?.building_id);
  const buildingName = buildings.find((b) => b.building_id === profile?.building_id)?.name;

  return (
    <div className="my-dorm">
      <header className="my-dorm__header">
        <IconDorm className="my-dorm__icon" />
        <div>
          <h2 className="my-dorm__title">{buildingName || "Set your dorm in Profile"}</h2>
          <p className="meta-text my-dorm__count">
            {dormListings.length} item{dormListings.length === 1 ? "" : "s"} available
          </p>
        </div>
      </header>

      {dormListings.length === 0 ? (
        <p className="my-dorm__empty">No one in your dorm has posted yet — be the first.</p>
      ) : (
        <div className="my-dorm__grid">
          {dormListings.map((listing) => (
            <ListingGridItem key={listing.id} listing={listing} onExpand={onExpand} />
          ))}
        </div>
      )}
    </div>
  );
}
