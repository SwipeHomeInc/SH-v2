import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const AlertCircleIcon = Icons?.AlertCircle || null;
const DollarSignIcon = Icons?.DollarSign || null;
const PhoneIcon = Icons?.Phone || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function SwipeCheckIntroScreen() {
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

  // Build items after icons are resolved
  const items = [
    { Icon: AlertCircleIcon, text: "Is something wrong here?" },
    { Icon: AlertCircleIcon, text: "What issues am I not seeing?" },
    { Icon: DollarSignIcon, text: "How much will this cost?" },
    { Icon: PhoneIcon, text: "Who do I call?" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E4E8EC",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center" }}
          activeOpacity={0.7}
        >
          {ChevronLeftIcon ? (
            <ChevronLeftIcon size={24} color="#00454F" />
          ) : (
            <Text style={{ color: "#00454F", fontSize: 18, fontWeight: "700" }}>
              ‹
            </Text>
          )}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 20,
              color: "#00454F",
              marginLeft: 8,
            }}
          >
            SwipeCheck Lite
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 24,
            color: "#000000",
            marginBottom: 16,
          }}
        >
          Every homeowner — and every contractor — asks the same questions:
        </Text>

        <View style={{ marginBottom: 32 }}>
          {items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#0095AE20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {item.Icon ? (
                  <item.Icon size={20} color="#0095AE" />
                ) : (
                  <Text style={{ color: "#0095AE", fontWeight: "700" }}>•</Text>
                )}
              </View>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 16,
                  color: "#414856",
                  flex: 1,
                }}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: "#DCEDE4",
            padding: 20,
            borderRadius: 12,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#007A3B",
              lineHeight: 24,
            }}
          >
            SwipeCheck Lite gives you a fast snapshot of the property so you can
            act with confidence.
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#0095AE",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => router.push("/(tabs)/category-select")}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            Start SwipeCheck Lite
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
