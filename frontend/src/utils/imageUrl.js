/**
 * Resolves image URLs for banners, offers, and arrivals.
 * Handles:
 *   - Absolute URLs (Cloudinary, S3, etc.) — returned as-is
 *   - Relative /uploads/... paths — prefixed with backend API URL
 *   - Empty/null — returns empty string
 */
const API = process.env.REACT_APP_API_URL || "";

export function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("data:")) return path;
  return `${API}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * React img component props with graceful fallback.
 * Usage: <img {...imgWithFallback(url, fallbackGradient)} />
 */
export function imgWithFallback(src, alt = "") {
  return {
    src: getImageUrl(src),
    alt,
    onError: (e) => {
      e.currentTarget.style.display = "none";
      const parent = e.currentTarget.parentElement;
      if (parent && !parent.dataset.fallbackApplied) {
        parent.dataset.fallbackApplied = "true";
        parent.style.background =
          "linear-gradient(135deg, #c9a227 0%, #a9771c 50%, #7a5a28 100%)";
      }
    },
  };
}
