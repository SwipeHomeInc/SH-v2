import { useAuth } from "@/utils/auth/useAuth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthModal } from "@/utils/auth/useAuthModal";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const [lastError, setLastError] = useState(null);
  const isProd =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production") ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_CREATE_ENV === "production");

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Minimal global error capture + console logging
  useEffect(() => {
    const prev =
      global.ErrorUtils && global.ErrorUtils.getGlobalHandler
        ? global.ErrorUtils.getGlobalHandler()
        : null;
    const handler = (error, isFatal) => {
      try {
        console.error("Global error captured:", error);
      } catch (_) {}
      // Defer state update to avoid updating RootLayout during another component's render
      setTimeout(() => {
        setLastError({
          message: error && error.message ? error.message : String(error),
          isFatal: !!isFatal,
        });
      }, 0);
      if (typeof prev === "function") {
        try {
          prev(error, isFatal);
        } catch (_) {}
      }
    };
    if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
      global.ErrorUtils.setGlobalHandler(handler);
    }
    return () => {
      if (
        global.ErrorUtils &&
        global.ErrorUtils.setGlobalHandler &&
        typeof prev === "function"
      ) {
        global.ErrorUtils.setGlobalHandler(prev);
      }
    };
  }, []);

  if (!isReady) {
    return null;
  }

  const DebugBanner = () => {
    if (isProd || !lastError) return null;
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#DC2626",
          paddingVertical: 8,
          paddingHorizontal: 12,
          zIndex: 50,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontWeight: "600" }}
            numberOfLines={2}
          >
            {lastError.isFatal ? "Fatal error:" : "Error:"} {lastError.message}
          </Text>
          <TouchableOpacity
            onPress={() => setLastError(null)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Dev-only debug banner to surface startup/runtime errors without blocking */}
        <DebugBanner />
        {/* Mount the auth modal at the root so it can be opened from anywhere */}
        <AuthModal />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
