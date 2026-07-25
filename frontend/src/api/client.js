import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

const client = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw new Error(error.response.data?.error || "Request failed");
    }

    throw error;
  }
);

export async function submitTestimonial(formData) {
  const { data } = await client.post("/testimonials", formData);
  return data;
}

export async function getTestimonials({ status, page, limit } = {}) {
  const { data } = await client.get("/testimonials", {
    params: { status, page, limit }
  });
  return data;
}

export async function getPublicTestimonials({ page, limit } = {}) {
  const { data } = await client.get("/testimonials/public", {
    params: { page, limit }
  });
  return data;
}

export async function updateStatus(id, status) {
  const { data } = await client.patch(`/testimonials/${id}/status`, { status });
  return data;
}

export async function deleteTestimonial(id) {
  const { data } = await client.delete(`/testimonials/${id}`);
  return data;
}

export default client;
