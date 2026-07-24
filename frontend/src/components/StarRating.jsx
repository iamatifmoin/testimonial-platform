import { useState } from "react";

const sizeClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl"
};

export default function StarRating({ value = 0, onChange, size = "md" }) {
  const [hoveredValue, setHoveredValue] = useState(0);
  const isInteractive = typeof onChange === "function";
  const activeValue = isInteractive && hoveredValue > 0 ? hoveredValue : value;

  return (
    <div
      className={`inline-flex items-center gap-1 ${sizeClasses[size] || sizeClasses.md}`}
      role={isInteractive ? "radiogroup" : undefined}
      aria-label={isInteractive ? "Star rating" : undefined}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= activeValue;

        return (
          <button
            key={starValue}
            type="button"
            onClick={isInteractive ? () => onChange(starValue) : undefined}
            onMouseEnter={isInteractive ? () => setHoveredValue(starValue) : undefined}
            onMouseLeave={isInteractive ? () => setHoveredValue(0) : undefined}
            className={[
              isInteractive ? "cursor-pointer" : "cursor-default",
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
            ].join(" ")}
            disabled={!isInteractive}
            role={isInteractive ? "radio" : undefined}
            aria-checked={isInteractive ? starValue === value : undefined}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <span className={filled ? "text-primary-500" : "text-gray-300"}>
              {filled ? "\u2605" : "\u2606"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
