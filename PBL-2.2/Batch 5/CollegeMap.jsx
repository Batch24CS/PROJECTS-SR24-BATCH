import CampusStaticMap from "../components/CampusStaticMap";

export default function CollegeMap() {
  return (
    <div className="space-y-5">
      <div className="app-card p-5">
        <h3 className="text-xl font-semibold text-sweety-ink dark:text-white">College Map</h3>
        <p className="text-sm text-muted">Sphoorthy Engineering College — campus locations</p>
      </div>
      <CampusStaticMap markerScale={1.2} />
    </div>
  );
}
