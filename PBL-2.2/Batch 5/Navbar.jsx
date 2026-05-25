export default function Navbar({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
