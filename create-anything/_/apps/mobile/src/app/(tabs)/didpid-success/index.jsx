import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
// Lazy-load lucide icon via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const CheckCircleIcon = Icons?.CheckCircle || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function DidpidSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const didpid = params.didpid || "";
  const address = params.address || "";

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: "#DCEDE4",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {CheckCircleIcon ? (
            <CheckCircleIcon size={54} color="#007A3B" />
          ) : (
            <Text>✓</Text>
          )}
        </View>

        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 26,
            color: "#000",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          DIDPID Created
        </Text>

        {!!didpid && (
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 22,
              color: "#00454F",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {didpid}
          </Text>
        )}

        {!!address && (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {address}
          </Text>
        )}

        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: "#414856",
            lineHeight: 22,
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          {
            "Your home now has a digital identity.\nAll SwipeChecks, photos, maintenance logs, warranties, and improvements\nwill automatically attach to this DIDPID."
          }
        </Text>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "#00454F",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={() => router.replace("/(tabs)/my-home")}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            View My Home Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "#0095AE",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={() => router.replace("/(tabs)/category-select")}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            Run SwipeCheck Lite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={() => router.replace("/(tabs)/home-details")}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#00454F",
            }}
          >
            Add Home Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "transparent",
            paddingVertical: 10,
            alignItems: "center",
          }}
          onPress={() => router.replace("/(tabs)/home")}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: "#7A8292",
            }}
          >
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
