const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4"
};

export default function Spinner({ size = "md" }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-gray-200 border-t-primary-600 ${sizeClasses[size] || sizeClasses.md}`}
      aria-label="Loading"
    />
  );
}
