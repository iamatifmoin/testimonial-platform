const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  row: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg"
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({ name, photoUrl, size = "md" }) {
  const classes = sizeClasses[size] || sizeClasses.md;

  if (photoUrl) {
    return (
      <div className={`${classes} overflow-hidden rounded-full bg-gray-100`}>
        <img src={photoUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${classes} items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
