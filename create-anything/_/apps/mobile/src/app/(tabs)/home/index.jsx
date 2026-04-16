import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// Replace custom icon hook with centralized safe loader
import { loadIcons } from "@/utils/safeIcons";

const ActionCard = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onPress,
  color,
}) => (
  <View
    style={{
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E4E8EC",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}
  >
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      {Icon ? (
        <Icon size={28} color={color} />
      ) : (
        <Text style={{ color, fontFamily: "Inter_700Bold" }}>
          {title?.[0] || ""}
        </Text>
      )}
    </View>

    <Text
      style={{
        fontFamily: "Inter_700Bold",
        fontSize: 20,
        color: "#000000",
        marginBottom: 8,
      }}
    >
      {title}
    </Text>

    <Text
      style={{
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        color: "#7A8292",
        lineHeight: 20,
        marginBottom: 16,
      }}
    >
      {description}
    </Text>

    <TouchableOpacity
      style={{
        backgroundColor: color,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 16,
          color: "#FFFFFF",
        }}
      >
        {buttonText}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Icons = loadIcons(); // centralized safe icons
  const FileText = Icons?.FileText || null;
  const Search = Icons?.Search || null;
  const Briefcase = Icons?.Briefcase || null;
  const ShieldIcon = Icons?.Shield || null;
  const RotateCcw = Icons?.RotateCcw || null;
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [hasProperty, setHasProperty] = useState(false);
  const [hasContractorLead, setHasContractorLead] = useState(false);

  // Check if we're in development mode
  const isProd =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production") ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_CREATE_ENV === "production");

  const loadMyProperty = useCallback(async () => {
    try {
      const res = await fetch("/api/properties/my-property");
      if (res.ok) {
        const data = await res.json();
        setHasProperty(!!data);
      } else {
        setHasProperty(false);
      }
    } catch (e) {
      console.error("Failed to load my property", e);
      setHasProperty(false);
    }
  }, []);

  const loadLead = useCallback(async () => {
    try {
      const r2 = await fetch("/api/contractors/lead-exists");
      if (r2.ok) {
        const j = await r2.json();
        setHasContractorLead(!!j.leadExists);
      }
    } catch (e) {
      console.error("Failed to check contractor lead", e);
    }
  }, []);

  useEffect(() => {
    loadMyProperty();
    loadLead();
  }, [loadMyProperty, loadLead]);

  useFocusEffect(
    useCallback(() => {
      loadMyProperty();
      loadLead();
    }, [loadMyProperty, loadLead]),
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#F5F8FA",
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 28,
                color: "#000000",
                marginBottom: 4,
              }}
            >
              Welcome to Swipe Home
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#7A8292",
              }}
            >
              Choose an action to get started
            </Text>
            {!hasProperty && (
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: "#9AA1AD",
                }}
              >
                Add your DIDPID to unlock contractor contact info.
              </Text>
            )}
          </View>

          {/* My Home Button */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/my-home")}
            style={{
              backgroundColor: "#00454F",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              marginLeft: 16,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#FFFFFF",
              }}
            >
              My Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {hasProperty ? (
          <ActionCard
            icon={FileText}
            title="View My Home"
            description="View your home details, DIDPID, and all your SwipeCheck history in one place."
            buttonText="View My Home"
            color="#00454F"
            onPress={() => router.push("/(tabs)/my-home")}
          />
        ) : (
          <ActionCard
            icon={FileText}
            title="Claim Your DIDPID™"
            description="Your home deserves a digital identity. A DIDPID tracks repairs, updates, warranties, and issues all in one place — no more digging through old papers when you sell."
            buttonText="Claim Your DIDPID™"
            color="#00454F"
            onPress={() => router.push("/(tabs)/didpid-create")}
          />
        )}

        <ActionCard
          icon={Search}
          title="Start SwipeCheck Lite"
          description="Find hidden issues, understand what matters, estimate cost, and know who to call."
          buttonText="Start SwipeCheck Lite"
          color="#0095AE"
          onPress={() => router.push("/(tabs)/swipecheck-intro")}
        />

        {!hasContractorLead && (
          <ActionCard
            icon={Briefcase}
            title="Be a Contractor"
            description="Join the Swipe Home network and connect with homeowners in your area."
            buttonText="Become a Swipe Contractor"
            color="#007A3B"
            onPress={() => router.push("/(tabs)/contractor-info")}
          />
        )}

        {/* Privacy & Terms Link */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            marginTop: 8,
          }}
          onPress={() => router.push("/(tabs)/privacy")}
          activeOpacity={0.7}
        >
          {ShieldIcon ? (
            <ShieldIcon size={16} color="#7A8292" />
          ) : (
            <Text style={{ color: "#7A8292", fontFamily: "Inter_700Bold" }}>
              P
            </Text>
          )}
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#7A8292",
              marginLeft: 6,
            }}
          >
            Privacy & Terms
          </Text>
        </TouchableOpacity>

        {/* Dev Reset Button - only show in development */}
        {!isProd && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              marginTop: 4,
            }}
            onPress={() => router.push("/dev-reset")}
            activeOpacity={0.7}
          >
            {RotateCcw ? (
              <RotateCcw size={16} color="#DC2626" />
            ) : (
              <Text style={{ color: "#DC2626", fontFamily: "Inter_700Bold" }}>
                R
              </Text>
            )}
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: "#DC2626",
                marginLeft: 6,
              }}
            >
              Reset Dev Data
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
