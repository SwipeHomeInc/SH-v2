import * as SecureStore from "expo-secure-store";
import { authKey } from "./auth/store";

/**
 * Authenticated fetch wrapper that automatically includes JWT token in headers
 */
export const authenticatedFetch = async (url, options = {}) => {
  try {
    // Get the stored auth token
    const authData = await SecureStore.getItemAsync(authKey);
    const authObject = authData ? JSON.parse(authData) : null;
    const token = authObject?.jwt || null;

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log("Making authenticated request to:", url);
    console.log("Has token:", !!token);

    // Make the fetch request with authentication
    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("Authenticated fetch error:", error);
    // Fallback to regular fetch if auth fails
    return fetch(url, options);
  }
};

export default authenticatedFetch;
