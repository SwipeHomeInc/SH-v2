import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const ShieldIcon = Icons?.Shield || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently delete all your data, including your DIDPID, property information, and SwipeCheck history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              const response = await fetch("/api/account/delete", {
                method: "DELETE",
              });
              if (response.ok) {
                Alert.alert(
                  "Account Deleted",
                  "Your account and all associated data have been deleted.",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/(tabs)/home"),
                    },
                  ],
                );
              } else {
                throw new Error("Failed to delete account");
              }
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again or contact support.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

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
            Privacy & Terms
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#00454F20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {ShieldIcon ? (
              <ShieldIcon size={32} color="#00454F" />
            ) : (
              <Text
                style={{
                  color: "#00454F",
                  fontSize: 18,
                  fontFamily: "Inter_700Bold",
                }}
              >
                SH
              </Text>
            )}
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Your Privacy Matters
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
              textAlign: "center",
            }}
          >
            We're committed to protecting your data
          </Text>
        </View>

        {/* What We Collect */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            What We Collect
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Property Information:
            </Text>{" "}
            Address, city, state, ZIP code, property details (bedrooms,
            bathrooms, square footage, year built), and property location
            coordinates (latitude/longitude) when you claim a DIDPID.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              SwipeCheck Data:
            </Text>{" "}
            Your answers to inspection questions, photos you upload, and
            AI-generated condition reports.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Account Information:
            </Text>{" "}
            Email address and name when you create an account.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Contractor Information:
            </Text>{" "}
            Name, company, email, phone, trade, and service area if you sign up
            as a contractor.
          </Text>
        </View>

        {/* How We Use It */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            How We Use Your Data
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • To create and maintain your unique DIDPID (property digital
            identity)
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • To generate AI-powered condition reports and recommendations
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • To match you with nearby contractors based on your property
            location and needs
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
            }}
          >
            • To improve our services and provide better recommendations
          </Text>
        </View>

        {/* Location Data */}
        <View
          style={{
            backgroundColor: "#FFF7ED",
            borderWidth: 1,
            borderColor: "#FED7AA",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#9A3412",
              marginBottom: 12,
            }}
          >
            Location Data
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#9A3412",
              lineHeight: 20,
            }}
          >
            When you enter a property address, we use Google Maps to determine
            the property's location coordinates (latitude and longitude). This
            helps us match you with nearby contractors and provide
            location-specific recommendations. We do not track your personal
            device location.
          </Text>
        </View>

        {/* Camera & Photos */}
        <View
          style={{
            backgroundColor: "#FFF7ED",
            borderWidth: 1,
            borderColor: "#FED7AA",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#9A3412",
              marginBottom: 12,
            }}
          >
            Camera & Photo Library Access
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#9A3412",
              lineHeight: 20,
            }}
          >
            We request access to your camera and photo library so you can add
            photos to your SwipeCheck reports. Photos help our AI and
            contractors better understand property conditions. You can skip
            adding photos at any time.
          </Text>
        </View>

        {/* Data Sharing */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            Data Sharing
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            We do not sell your personal information. We may share your data
            with:
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Contractors:
            </Text>{" "}
            When you choose to contact a contractor, they may see your property
            location and SwipeCheck details.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Service Providers:
            </Text>{" "}
            Third-party services like Google Maps, AI providers, and cloud
            storage to operate the app.
          </Text>
        </View>

        {/* Third-Party Data Protection */}
        <View
          style={{
            backgroundColor: "#EFF6FF",
            borderWidth: 1,
            borderColor: "#BFDBFE",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#1E40AF",
              marginBottom: 12,
            }}
          >
            Third-Party Data Protection
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#1E40AF",
              lineHeight: 20,
            }}
          >
            Any third parties with whom we share your data will provide the same
            or greater level of privacy protection as outlined in this policy
            and as required by applicable privacy laws and App Store Guidelines.
            We carefully vet our service providers to ensure they maintain
            strong data security practices and comply with privacy regulations.
          </Text>
        </View>

        {/* Your Rights */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            Your Rights
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • <Text style={{ fontFamily: "Inter_600SemiBold" }}>Access:</Text>{" "}
            You can view all your property and SwipeCheck data in the app.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • <Text style={{ fontFamily: "Inter_600SemiBold" }}>Update:</Text>{" "}
            You can edit your property details and account information at any
            time.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            • <Text style={{ fontFamily: "Inter_600SemiBold" }}>Delete:</Text>{" "}
            You can delete your account and all associated data directly from
            this app using the button below.
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            •{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Revoke Consent:
            </Text>{" "}
            You can revoke camera or location permissions in your device
            settings at any time.
          </Text>

          {/* In-app Delete Account Button */}
          <TouchableOpacity
            style={{
              backgroundColor: deleting ? "#9AA1AD" : "#DC2626",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Delete My Account
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Data Retention */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            Data Retention
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
            }}
          >
            We retain your data as long as your account is active or as needed
            to provide services. If you request account deletion, we will delete
            your personal data within 30 days, except where we're required to
            retain it by law.
          </Text>
        </View>

        {/* Contact */}
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
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: "#000000",
              marginBottom: 12,
            }}
          >
            Contact Us
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#414856",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            If you have questions about this privacy policy or want to exercise
            your rights, please contact us:
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:privacy@swipehome.com")}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#0095AE",
              }}
            >
              privacy@swipehome.com
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#9AA1AD",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Last updated: December 4, 2025
        </Text>
      </ScrollView>
    </View>
  );
}
