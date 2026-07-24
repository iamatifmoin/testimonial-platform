export default function Toast({ message, type = "success", visible }) {
  const isSuccess = type === "success";

  return (
    <div
      className={[
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg transition-all duration-150 ease-in-out",
        isSuccess ? "bg-green-600" : "bg-red-600",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      ].join(" ")}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg">{isSuccess ? "✓" : "×"}</span>
      <span>{message}</span>
    </div>
  );
}
