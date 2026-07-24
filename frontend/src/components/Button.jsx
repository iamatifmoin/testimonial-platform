import Spinner from "./Spinner";

const variantClasses = {
  primary: "bg-primary-600 text-white hover:bg-primary-700",
  secondary: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm"
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className
      ].join(" ")}
    >
      {loading ? <Spinner size="sm" /> : null}
      <span>{children}</span>
    </button>
  );
}
