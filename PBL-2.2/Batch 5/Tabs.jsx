export default function Tabs({ tabs, active, setActive }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            active === tab ? "bg-sweety-red text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
