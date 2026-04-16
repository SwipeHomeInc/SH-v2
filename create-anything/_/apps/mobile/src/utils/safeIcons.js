// Safe icon loader that prevents crashes from missing packages
export const loadIcons = () => {
  // In production builds, do not load lucide at all.
  const isProd =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production") ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_CREATE_ENV === "production");

  if (isProd) {
    return {};
  }

  try {
    // Only attempt to require in non-production environments
    return require("lucide-react-native");
  } catch (error) {
    console.warn("Failed to load lucide-react-native icons:", error);
    return {};
  }
};

export default loadIcons;
