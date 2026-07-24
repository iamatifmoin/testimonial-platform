import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteTestimonial, getTestimonials, updateStatus } from "../api/client";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import StarRating from "../components/StarRating";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "pending", "approved", "rejected"];

const EMPTY_STATE_CONTENT = {
  all: {
    icon: "\uD83D\uDCAC",
    title: "No testimonials yet",
    description: "Share your submission link to get started."
  },
  pending: {
    icon: "\uD83D\uDCEC",
    title: "Nothing to review",
    description: "New testimonials will appear here."
  },
  approved: {
    icon: "\u2705",
    title: "No approved testimonials yet",
    description: ""
  },
  rejected: {
    icon: "\uD83D\uDDD1\uFE0F",
    title: "No rejected testimonials",
    description: ""
  }
};

function formatDate(createdAt) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getSentimentClasses(sentiment) {
  if (sentiment === "positive") {
    return "bg-green-100 text-green-700";
  }

  if (sentiment === "negative") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-600";
}

function buildCountMap([allResponse, pendingResponse, approvedResponse, rejectedResponse]) {
  return {
    all: allResponse.total || 0,
    pending: pendingResponse.total || 0,
    approved: approvedResponse.total || 0,
    rejected: rejectedResponse.total || 0
  };
}

function LoadingRows() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="animate-pulse border-b border-gray-100 py-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-4/5 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-200" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-lg bg-gray-200" />
              <div className="h-8 w-20 rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestimonialRow({ testimonial, actionLoading, onStatusChange, onDelete }) {
  const isPending = testimonial.status === "pending";
  const isApproved = testimonial.status === "approved";
  const isRejected = testimonial.status === "rejected";

  return (
    <article className="border-b border-gray-100 py-4 transition-colors duration-150 hover:bg-gray-50">
      <div className="flex items-start gap-4">
        <Avatar name={testimonial.name} photoUrl={testimonial.photo_url} size="row" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold text-gray-900">{testimonial.name}</h3>
            <p className="text-sm text-gray-500">{testimonial.company || "No company"}</p>
            <StarRating value={testimonial.rating} size="sm" />
          </div>

          <p
            className="mt-2 text-sm text-gray-600"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden"
            }}
          >
            {testimonial.text}
          </p>

          {testimonial.sentiment ? (
            <div className="mt-2">
              <span
                className={[
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  getSentimentClasses(testimonial.sentiment)
                ].join(" ")}
              >
                {testimonial.sentiment}
              </span>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center text-xs text-gray-400">
            <span>{formatDate(testimonial.created_at)}</span>
            <span className="ml-3">{testimonial.email}</span>
          </div>
        </div>

        <div className="shrink-0">
          <Badge status={testimonial.status} />
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {isPending ? (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={actionLoading}
                onClick={() => onStatusChange(testimonial, "approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={actionLoading}
                onClick={() => onStatusChange(testimonial, "rejected")}
              >
                Reject
              </Button>
            </>
          ) : null}

          {isApproved ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => onStatusChange(testimonial, "rejected")}
            >
              Reject
            </Button>
          ) : null}

          {isRejected ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => onStatusChange(testimonial, "approved")}
            >
              Approve
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            disabled={actionLoading}
            onClick={() => onDelete(testimonial)}
            className="px-2.5"
          >
            {"\u00D7"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = STATUS_TABS.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const [testimonials, setTestimonials] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({});
  const { toast, showToast } = useToast();

  const currentStatus = activeTab === "all" ? undefined : activeTab;

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);

    try {
      const responses = await Promise.all([
        getTestimonials({ limit: 1 }),
        getTestimonials({ status: "pending", limit: 1 }),
        getTestimonials({ status: "approved", limit: 1 }),
        getTestimonials({ status: "rejected", limit: 1 })
      ]);

      setCounts(buildCountMap(responses));
    } catch (err) {
      showToast(err.message || "Failed to load dashboard counts", "error");
    } finally {
      setCountsLoading(false);
    }
  }, [showToast]);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getTestimonials({
        status: currentStatus,
        page,
        limit: PAGE_SIZE
      });

      setTestimonials(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (err) {
      setError(err.message || "Failed to load testimonials");
      setTestimonials([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, page]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const emptyState = useMemo(() => EMPTY_STATE_CONTENT[activeTab] || EMPTY_STATE_CONTENT.all, [activeTab]);

  const tabs = useMemo(
    () =>
      STATUS_TABS.map((status) => ({
        key: status,
        label: status === "all" ? "All" : status[0].toUpperCase() + status.slice(1),
        count: counts[status] || 0
      })),
    [counts]
  );

  const updateCountsForStatusChange = useCallback((previousStatus, nextStatus) => {
    setCounts((current) => ({
      ...current,
      pending: Math.max(0, current.pending - (previousStatus === "pending" ? 1 : 0) + (nextStatus === "pending" ? 1 : 0)),
      approved: Math.max(
        0,
        current.approved - (previousStatus === "approved" ? 1 : 0) + (nextStatus === "approved" ? 1 : 0)
      ),
      rejected: Math.max(
        0,
        current.rejected - (previousStatus === "rejected" ? 1 : 0) + (nextStatus === "rejected" ? 1 : 0)
      )
    }));
  }, []);

  const handleStatusChange = useCallback(
    async (testimonial, nextStatus) => {
      const previousStatus = testimonial.status;
      const shouldRemoveFromList = activeTab !== "all" && activeTab !== nextStatus;
      const previousTestimonials = testimonials;
      const previousTotal = total;
      const previousTotalPages = totalPages;
      const nextTotal = Math.max(0, previousTotal - (shouldRemoveFromList ? 1 : 0));
      const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / PAGE_SIZE);

      setActionState((current) => ({ ...current, [testimonial.id]: true }));
      updateCountsForStatusChange(previousStatus, nextStatus);

      if (shouldRemoveFromList) {
        setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
      } else {
        setTestimonials((current) =>
          current.map((item) => (item.id === testimonial.id ? { ...item, status: nextStatus } : item))
        );
      }

      try {
        await updateStatus(testimonial.id, nextStatus);
        showToast(`Testimonial ${nextStatus === "approved" ? "approved" : "rejected"}`);

        if (shouldRemoveFromList && nextTotal === 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      } catch (err) {
        updateCountsForStatusChange(nextStatus, previousStatus);
        setTestimonials(previousTestimonials);
        setTotal(previousTotal);
        setTotalPages(previousTotalPages);
        showToast(err.message || "Failed to update testimonial", "error");
      } finally {
        setActionState((current) => ({ ...current, [testimonial.id]: false }));
      }
    },
    [activeTab, page, showToast, testimonials, total, totalPages, updateCountsForStatusChange]
  );

  const handleDelete = useCallback(
    async (testimonial) => {
      const confirmed = window.confirm("Delete this testimonial?");

      if (!confirmed) {
        return;
      }

      const previousTestimonials = testimonials;
      const previousTotal = total;
      const previousTotalPages = totalPages;
      const previousCounts = counts;
      const nextTotal = Math.max(0, previousTotal - 1);
      const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / PAGE_SIZE);

      setActionState((current) => ({ ...current, [testimonial.id]: true }));
      setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      setCounts((current) => ({
        all: Math.max(0, current.all - 1),
        pending: Math.max(0, current.pending - (testimonial.status === "pending" ? 1 : 0)),
        approved: Math.max(0, current.approved - (testimonial.status === "approved" ? 1 : 0)),
        rejected: Math.max(0, current.rejected - (testimonial.status === "rejected" ? 1 : 0))
      }));

      try {
        await deleteTestimonial(testimonial.id);
        showToast("Testimonial deleted");

        if (nextTotal === 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      } catch (err) {
        setTestimonials(previousTestimonials);
        setTotal(previousTotal);
        setTotalPages(previousTotalPages);
        setCounts(previousCounts);
        await loadCounts();
        await loadTestimonials();
        showToast(err.message || "Failed to delete testimonial", "error");
      } finally {
        setActionState((current) => ({ ...current, [testimonial.id]: false }));
      }
    },
    [counts, loadCounts, loadTestimonials, page, showToast, testimonials, total, totalPages]
  );

  const handleTabChange = useCallback(
    (status) => {
      const nextParams = new URLSearchParams(searchParams);

      if (status === "all") {
        nextParams.delete("status");
      } else {
        nextParams.set("status", status);
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const hasPagination = totalPages > 1;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            {counts.pending || 0} pending
          </span>
        </div>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-6">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={[
                  "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                ].join(" ")}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-600"
                  ].join(" ")}
                >
                  {countsLoading ? "..." : tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {loading ? <LoadingRows /> : null}

        {!loading && error ? (
          <EmptyState icon="\u26A0\uFE0F" title="Could not load testimonials" description={error} />
        ) : null}

        {!loading && !error && testimonials.length === 0 ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
          />
        ) : null}

        {!loading && !error && testimonials.length > 0 ? (
          <div>
            <div className="divide-y divide-gray-100">
              {testimonials.map((testimonial) => (
                <TestimonialRow
                  key={testimonial.id}
                  testimonial={testimonial}
                  actionLoading={Boolean(actionState[testimonial.id])}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {hasPagination ? (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}
