import { useCallback, useEffect, useState } from "react";
import { getTestimonials } from "../api/client";

export function useTestimonials(initialStatus) {
  const [testimonials, setTestimonials] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getTestimonials({
        status: initialStatus,
        page
      });

      setTestimonials(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [initialStatus, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { testimonials, total, loading, error, page, setPage, refetch };
}

export default useTestimonials;
