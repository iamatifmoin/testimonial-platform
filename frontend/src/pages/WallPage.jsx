import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicTestimonials } from "../api/client";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import TestimonialCard from "../components/TestimonialCard";

const PAGE_SIZE = 12;
const DISMISS_KEY = "testimonial-wall-embed-banner-hidden";
const RATING_FILTERS = ["all", 5, 4, 3, 2, 1];

function mergeTestimonials(existing, incoming) {
  const byId = new Map(existing.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    byId.set(item.id, item);
  });

  return Array.from(byId.values());
}

function getMonthCount(testimonials) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return testimonials.filter((testimonial) => {
    const createdAt = new Date(testimonial.created_at);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;
}

function getAverageRating(testimonials) {
  if (!testimonials.length) {
    return 0;
  }

  const totalRating = testimonials.reduce((sum, testimonial) => sum + (Number(testimonial.rating) || 0), 0);
  return totalRating / testimonials.length;
}

function SkeletonGrid() {
  return (
    <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[180px] animate-pulse rounded-xl border border-gray-100 bg-gray-100 shadow-sm"
        />
      ))}
    </div>
  );
}

function RatingFilter({ selectedRating, onSelect }) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      <span className="text-sm font-medium text-gray-600">Filter by rating:</span>
      {RATING_FILTERS.map((value) => {
        const isAll = value === "all";
        const isSelected = selectedRating === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={[
              "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              isSelected
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            ].join(" ")}
          >
            {isAll ? "All" : `\u2605 ${value}`}
          </button>
        );
      })}
    </div>
  );
}

export default function WallPage() {
  const navigate = useNavigate();
  const [allLoaded, setAllLoaded] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [selectedRating, setSelectedRating] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [bannerVisible, setBannerVisible] = useState(() => sessionStorage.getItem(DISMISS_KEY) !== "true");

  useEffect(() => {
    const previousTitle = document.title;
    const metaSelector = 'meta[property="og:description"]';
    let metaTag = document.querySelector(metaSelector);
    const createdMetaTag = !metaTag;

    document.title = "Testimonials — Testimonial-Platform";

    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("property", "og:description");
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute(
      "content",
      "Browse real customer testimonials and see why people love Testimonial-Platform."
    );

    return () => {
      document.title = previousTitle;

      if (createdMetaTag) {
        metaTag.remove();
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialPage() {
      setLoading(true);
      setError("");

      try {
        const response = await getPublicTestimonials({ page: 1, limit: PAGE_SIZE });

        if (!isActive) {
          return;
        }

        setAllLoaded(response.data || []);
        setPage(response.page || 1);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(err.message || "Failed to load testimonials");
        setAllLoaded([]);
        setPage(1);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadInitialPage();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const nextDisplayed =
      selectedRating === "all"
        ? allLoaded
        : allLoaded.filter((testimonial) => Number(testimonial.rating) === selectedRating);

    setDisplayed(nextDisplayed);
  }, [allLoaded, selectedRating]);

  async function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    setError("");

    try {
      const response = await getPublicTestimonials({ page: nextPage, limit: PAGE_SIZE });

      setAllLoaded((current) => mergeTestimonials(current, response.data || []));
      setPage(response.page || nextPage);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (err) {
      setError(err.message || "Failed to load more testimonials");
    } finally {
      setLoadingMore(false);
    }
  }

  function dismissBanner() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setBannerVisible(false);
  }

  function openDemoPage() {
    window.open("/demo.html", "_blank", "noopener,noreferrer");
  }

  const averageRating = getAverageRating(allLoaded);
  const monthCount = getMonthCount(allLoaded);
  const hasMore = page < totalPages;
  const isCompletelyEmpty = !loading && !error && total === 0;
  const showFilteredEmpty = !loading && !error && total > 0 && displayed.length === 0;

  return (
    <div className="page-enter pb-8">
      {bannerVisible ? (
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-primary-100 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={openDemoPage}
            className="flex-1 text-left"
          >
            <p className="text-sm font-medium text-primary-900">
              Add this wall to your website - embed it with our widget.
            </p>
            <span className="mt-1 inline-block rounded-md text-sm font-medium text-primary-700 transition-colors duration-150 hover:text-primary-800">
              Learn how {"\u2192"}
            </span>
          </button>

          <button
            type="button"
            onClick={dismissBanner}
            className="self-start rounded-full p-2 text-primary-500 transition-colors duration-150 hover:bg-primary-100 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:self-auto"
            aria-label="Dismiss embed banner"
          >
            {"\u00D7"}
          </button>
        </div>
      ) : null}

      <section className="py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">TESTIMONIALS</p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">Loved by our customers</h1>
        <p className="mt-3 text-gray-500">Here&apos;s what real customers say about us.</p>

        {!loading ? (
          <div className="mt-8 flex flex-wrap justify-center gap-8">
            <div>
              <p className="text-2xl font-bold text-gray-900">{allLoaded.length}+</p>
              <p className="text-sm text-gray-500">reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{"\u2605"} {averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">average</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{monthCount}</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
          </div>
        ) : null}

        <RatingFilter selectedRating={selectedRating} onSelect={setSelectedRating} />
      </section>

      {loading ? <SkeletonGrid /> : null}

      {!loading && error ? (
        <EmptyState icon="\u26A0\uFE0F" title="Could not load testimonials" description={error} />
      ) : null}

      {isCompletelyEmpty ? (
        <EmptyState
          icon=""
          title="No testimonials yet"
          description="Be the first to share your experience!"
          action={
            <Button variant="primary" onClick={() => navigate("/")}>
              Leave a testimonial
            </Button>
          }
        />
      ) : null}

      {showFilteredEmpty ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-gray-900">No testimonials match this rating yet.</p>
          <p className="mt-2 text-sm text-gray-500">Try another filter or load more reviews.</p>
        </div>
      ) : null}

      {!loading && !error && displayed.length > 0 ? (
        <>
          <section className="mt-12 columns-1 gap-4 md:columns-2 lg:columns-3">
            {displayed.map((testimonial) => (
              <div key={testimonial.id} className="mb-4 break-inside-avoid">
                <TestimonialCard testimonial={testimonial} showStatus={false} />
              </div>
            ))}
          </section>

          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            {loadingMore ? <Spinner size="sm" /> : null}

            {!loadingMore && hasMore ? (
              <Button variant="secondary" onClick={handleLoadMore}>
                Load more
              </Button>
            ) : null}

            {!hasMore ? (
              <p className="text-center text-sm text-gray-400">You&apos;ve seen all {total} testimonials</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
