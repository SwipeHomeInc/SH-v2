import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const UsersIcon = Icons?.Users || null;
const CheckCircleIcon = Icons?.CheckCircle || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function ContractorInfoScreen() {
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
            <Text style={{ color: "#00454F", fontSize: 24, marginRight: 8 }}>
              {"<"}
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
            Join Our Network
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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#007A3B20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            alignSelf: "center",
          }}
        >
          {UsersIcon ? (
            <UsersIcon size={40} color="#007A3B" />
          ) : (
            <Text style={{ color: "#007A3B", fontSize: 40, marginRight: 8 }}>
              {" "}
            </Text>
          )}
        </View>

        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            color: "#000000",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Join the Swipe Home Network
        </Text>

        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            color: "#414856",
            lineHeight: 24,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          Contractors can run SwipeCheck Lite inside the app to see exactly what
          homeowners experience.
          {"\n\n"}
          If you want to get matched with homeowners as we roll out new cities,
          leave your info below.
        </Text>

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
              marginBottom: 12,
            }}
          >
            Why Join?
          </Text>
          {[
            "Get matched with local homeowners",
            "Early access to new markets",
            "Use SwipeCheck Lite yourself",
            "No upfront costs",
          ].map((benefit, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: index < 3 ? 8 : 0,
              }}
            >
              {CheckCircleIcon ? (
                <CheckCircleIcon size={16} color="#007A3B" />
              ) : (
                <Text
                  style={{ color: "#007A3B", fontSize: 16, marginRight: 8 }}
                >
                  {" "}
                </Text>
              )}
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#007A3B",
                  marginLeft: 8,
                }}
              >
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#007A3B",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => router.push("/(tabs)/contractor-signup")}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            Become a Swipe Contractor
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
