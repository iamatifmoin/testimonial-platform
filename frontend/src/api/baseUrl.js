function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function getApiOrigin() {
  const configuredOrigin = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredOrigin === "string" && configuredOrigin.trim()) {
    return trimTrailingSlash(configuredOrigin.trim());
  }

  return "";
}

export function getApiBaseUrl() {
  const apiOrigin = getApiOrigin();
  return apiOrigin ? `${apiOrigin}/api` : "/api";
}

export function resolveBackendUrl(path) {
  if (!path) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiOrigin = getApiOrigin();
  return apiOrigin ? `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}` : path;
}
