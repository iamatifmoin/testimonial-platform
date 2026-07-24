const statusClasses = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700"
};

export default function Badge({ status = "pending", className = "" }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusClasses[status] || statusClasses.pending,
        className
      ].join(" ")}
    >
      {status}
    </span>
  );
}
