import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";

export default function DevResetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, isAuthenticated, auth, signIn } = useAuth();
  const [state, setState] = useState({
    loading: false,
    error: null,
    done: false,
  });

  const doReset = useCallback(async () => {
    if (!isReady || !isAuthenticated || state.loading || state.done) return;
    try {
      setState({ loading: true, error: null, done: false });
      const headers = { "Content-Type": "application/json" };
      if (auth?.jwt) headers["Authorization"] = `Bearer ${auth.jwt}`;
      const res = await fetch("/api/dev/reset-my-data", {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ||
            `When calling /api/dev/reset-my-data, the response was [${res.status}] ${res.statusText}`,
        );
      }
      await res.json();
      setState({ loading: false, error: null, done: true });
    } catch (e) {
      console.error("dev-reset mobile error", e);
      setState({
        loading: false,
        error: e?.message || "Reset failed",
        done: false,
      });
    }
  }, [auth?.jwt, isAuthenticated, isReady, state.done, state.loading]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      doReset();
    }
  }, [isReady, isAuthenticated, doReset]);

  return (
    <View style={{ flex: 1, backgroundColor: "#00454F" }}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          Reset My Data
        </Text>
        {!isReady ? (
          <Text style={{ color: "#FFF", opacity: 0.9 }}>Loading…</Text>
        ) : !isAuthenticated ? (
          <TouchableOpacity
            onPress={() => signIn()}
            style={{
              backgroundColor: "#FFF",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#00454F", fontWeight: "600" }}>
              Sign in to reset
            </Text>
          </TouchableOpacity>
        ) : state.loading ? (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator color="#FFF" />
            <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 8 }}>
              Resetting…
            </Text>
          </View>
        ) : state.done ? (
          <Text style={{ color: "#9AE6B4" }}>Data reset complete</Text>
        ) : state.error ? (
          <Text style={{ color: "#FEE2E2" }}>{state.error}</Text>
        ) : (
          <TouchableOpacity
            onPress={doReset}
            style={{
              backgroundColor: "#FFF",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#00454F", fontWeight: "600" }}>
              Reset now
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/splash")}
          style={{ marginTop: 24 }}
        >
          <Text style={{ color: "#FFF", textDecorationLine: "underline" }}>
            Back to splash
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
