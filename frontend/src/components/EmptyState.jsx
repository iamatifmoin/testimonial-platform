export default function EmptyState({ icon, title, description, action = null }) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-gray-700">{title}</h2>
      <p className="mt-2 text-gray-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
