const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const originalFetch = window.fetch.bind(window);

export const apiFetch = (url, options = {}) => {
  const fullUrl =
    typeof url === "string" && url.startsWith("/api/")
      ? `${API_BASE_URL}${url}`
      : url;

  return originalFetch(fullUrl, options);
};

// Make existing fetch("/api/...") calls work without changing
// every component individually.
window.fetch = (url, options = {}) => {
  const fullUrl =
    typeof url === "string" && url.startsWith("/api/")
      ? `${API_BASE_URL}${url}`
      : url;

  return originalFetch(fullUrl, options);
};

export default API_BASE_URL;