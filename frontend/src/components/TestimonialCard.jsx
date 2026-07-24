import { useState } from "react";
import Avatar from "./Avatar";
import Badge from "./Badge";
import StarRating from "./StarRating";

const TEXT_PREVIEW_LIMIT = 200;

function formatDate(createdAt) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > TEXT_PREVIEW_LIMIT;
  const visibleText =
    shouldTruncate && !expanded ? `${text.slice(0, TEXT_PREVIEW_LIMIT)}…` : text;

  return (
    <div className="mt-4">
      <p className="text-gray-700 italic">{visibleText}</p>
      {shouldTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 cursor-pointer text-xs font-medium text-primary-600 transition-colors duration-150 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {expanded ? "show less" : "read more"}
        </button>
      ) : null}
    </div>
  );
}

export default function TestimonialCard({ testimonial, showStatus = false, compact = false }) {
  return (
    <article
      className={[
        "rounded-xl bg-white transition-colors duration-150",
        compact ? "p-0" : "border border-gray-100 p-6 shadow-sm hover:border-gray-200"
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <Avatar name={testimonial.name} photoUrl={testimonial.photo_url} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
              <p className="text-sm text-gray-500">{testimonial.company || "No company"}</p>
            </div>
            {showStatus && testimonial.status ? <Badge status={testimonial.status} /> : null}
          </div>
          <div className="mt-3">
            <StarRating value={testimonial.rating} size="sm" />
          </div>
        </div>
      </div>

      <ExpandableText text={testimonial.text || ""} />

      <p className="mt-4 text-xs text-gray-400">{formatDate(testimonial.created_at)}</p>
    </article>
  );
}
