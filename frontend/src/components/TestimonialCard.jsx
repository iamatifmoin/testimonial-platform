import Avatar from "./Avatar";
import Badge from "./Badge";
import StarRating from "./StarRating";

function formatDate(createdAt) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default function TestimonialCard({ testimonial, showStatus = false }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-colors duration-150 hover:border-gray-200">
      <div className="flex items-start gap-4">
        <Avatar name={testimonial.name} photoUrl={testimonial.photo_url} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
              <p className="text-sm text-gray-500">{testimonial.company}</p>
            </div>
            {showStatus && testimonial.status ? <Badge status={testimonial.status} /> : null}
          </div>
          <div className="mt-3">
            <StarRating value={testimonial.rating} size="sm" />
          </div>
        </div>
      </div>

      <p
        className="mt-4 overflow-hidden text-ellipsis text-gray-700 italic"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4
        }}
      >
        {testimonial.text}
      </p>

      <p className="mt-4 text-xs text-gray-400">{formatDate(testimonial.created_at)}</p>
    </article>
  );
}
