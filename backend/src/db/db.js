const TESTIMONIALS_TABLE = "testimonials";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.append(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request({
  method = "GET",
  table = TESTIMONIALS_TABLE,
  query,
  body,
  headers = {},
}) {
  const supabaseUrl = normalizeBaseUrl(getRequiredEnv("SUPABASE_URL"));
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY"
    );
  }

  const url = `${supabaseUrl}/rest/v1/${table}${buildQueryString(query)}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error || data.details)) ||
      `Supabase request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return {
    data,
    headers: response.headers,
    status: response.status,
  };
}

const db = {
  table: TESTIMONIALS_TABLE,
  request,
};

module.exports = db;
