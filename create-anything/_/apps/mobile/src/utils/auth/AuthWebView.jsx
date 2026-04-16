import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useAuthStore } from "./store";

const callbackUrl = "/api/auth/expo-web-success"; // use HTML success page for both web and native
const callbackQueryString = `callbackUrl=${callbackUrl}`;

/**
 * This renders a WebView for authentication and handles both web and native platforms.
 */
export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const [currentURI, setURI] = useState(
    `${baseURL}/account/${mode}?${callbackQueryString}`,
  );
  const { auth, setAuth, isReady } = useAuthStore();
  const isAuthenticated = isReady ? !!auth : null;
  const iframeRef = useRef(null);
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    if (isAuthenticated) {
      router.back();
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setURI(`${baseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) {
      return;
    }
    const handleMessage = (event) => {
      // Verify the origin for security
      const proxyBaseURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || '';
      if (proxyBaseURL && event.origin !== proxyBaseURL) {
        return;
      }
      if (event.data.type === "AUTH_SUCCESS") {
        setAuth({
          jwt: event.data.jwt,
          user: event.data.user,
        });
      } else if (event.data.type === "AUTH_ERROR") {
        console.error("Auth error:", event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setAuth]);

  if (Platform.OS === "web") {
    const handleIframeError = () => {
      console.error("Failed to load auth iframe");
    };

    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${proxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: "100%", height: "100%", border: "none" }}
        onError={handleIframeError}
      />
    );
  }
  // Guard against undefined environment variables
  const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
  const host = process.env.EXPO_PUBLIC_HOST || '';
  
  return (
    <WebView
      sharedCookiesEnabled
      source={{
        uri: currentURI,
      }}
      headers={{
        "x-createxyz-project-group-id": projectGroupId,
        host: host,
        "x-forwarded-host": host,
        "x-createxyz-host": host,
      }}
      onShouldStartLoadWithRequest={(request) => {
        // Allow loading the success URL so it can postMessage the credentials
        const successURL = `${baseURL}${callbackUrl}`;
        if (request.url === currentURI) return true;
        if (request.url.startsWith(successURL)) {
          return true; // let WebView load it; we'll receive onMessage
        }

        // Always carry the callback param forward and normalize host
        const hasParams = request.url.includes("?");
        const separator = hasParams ? "&" : "?";
        const newURL = request.url.replaceAll(proxyURL, baseURL);
        if (newURL.endsWith(callbackUrl)) {
          setURI(newURL);
          return false;
        }
        setURI(`${newURL}${separator}${callbackQueryString}`);
        return false;
      }}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data?.type === "AUTH_SUCCESS") {
            setAuth({ jwt: data.jwt, user: data.user });
          } else if (data?.type === "AUTH_ERROR") {
            console.error("Auth error:", data.error);
          }
        } catch (e) {
          // Non-JSON messages can be ignored
        }
      }}
      style={{ flex: 1 }}
    />
  );
};
