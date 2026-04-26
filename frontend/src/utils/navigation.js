export const getCurrentRoute = (location) => {
  if (!location) return "/";
  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}` || "/";
};

export const getBackTarget = (location, fallback = "/Home") => {
  return location?.state?.backTo || fallback;
};
