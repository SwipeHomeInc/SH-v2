export function loadMaps() {
  const isProd =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "production";

  if (isProd) {
    return null;
  }

  try {
    const mod = require("react-native-maps");
    return {
      MapView: mod?.MapView ?? null,
      Marker: mod?.Marker ?? null,
    };
  } catch (e) {
    console.error("react-native-maps failed to load:", e);
    return null;
  }
}
