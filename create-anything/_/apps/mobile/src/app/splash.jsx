import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { loadIcons } from "@/utils/safeIcons";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Centralized production-safe icon loader
  const Icons = loadIcons();
  const HomeIcon = Icons?.Home || null;

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
        {/* Logo */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          {HomeIcon ? (
            <HomeIcon size={60} color="#00454F" />
          ) : (
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 28,
                color: "#00454F",
              }}
            >
              SH
            </Text>
          )}
        </View>

        {/* Title (long-press to open reset screen) */}
        <TouchableOpacity
          onLongPress={() => router.push("/dev-reset")}
          delayLongPress={600}
          activeOpacity={1}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 32,
              color: "#FFFFFF",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Swipe Home
          </Text>
        </TouchableOpacity>

        {/* Tagline */}
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 18,
            color: "#FFFFFF",
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          Your home's digital checkup starts here.
        </Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#FFFFFF",
            paddingVertical: 16,
            paddingHorizontal: 48,
            borderRadius: 12,
            width: "100%",
            alignItems: "center",
          }}
          onPress={() => router.replace("/(tabs)/home")}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#00454F",
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
