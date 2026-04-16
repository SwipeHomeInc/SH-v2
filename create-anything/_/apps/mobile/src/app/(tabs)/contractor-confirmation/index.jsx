import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
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

export default function ContractorConfirmationScreen() {
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

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 48,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#DCEDE4",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <CheckCircleIcon size={56} color="#007A3B" />
        </View>

        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            color: "#000000",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Thank You!
        </Text>

        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            color: "#414856",
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 48,
          }}
        >
          Thanks — we've got your info. As we expand into your area, you'll be
          among the first invited.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: "#00454F",
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
              color: "#FFFFFF",
            }}
          >
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
