import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  InputAccessoryView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
// Lazy-load lucide icon via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Picker } from "@react-native-picker/picker";

const trades = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "General Contractor",
  "Carpentry",
  "Cabinetry / Custom Woodworking", // new trade option
  "Painting",
  "Landscaping",
  "Other",
];

export default function ContractorSignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    trade: trades[0],
    zip: "",
    notes: "",
  });

  // Add refs for soft-tab navigation
  const nameRef = useRef(null);
  const companyRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const zipRef = useRef(null);
  const notesRef = useRef(null);

  // accessory view IDs for iOS number/phone keyboards
  const phoneAccessoryID = "phoneAccessory";
  const zipAccessoryID = "zipAccessory";

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.trade || !formData.zip) {
      setError("Please fill in all required fields");
      return;
    }

    if (!consentGiven) {
      setError(
        "Please agree to the Privacy Policy and Terms of Service to continue",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/contractors/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      router.replace("/(tabs)/contractor-confirmation");
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
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
            Contractor Signup
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
        {error && (
          <View
            style={{
              backgroundColor: "#FEE",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: "#C00",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Name *
          </Text>
          <TextInput
            ref={nameRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
            }}
            placeholder="John Smith"
            placeholderTextColor="#C9D0DC"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => companyRef.current?.focus?.()}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Company
          </Text>
          <TextInput
            ref={companyRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
            }}
            placeholder="ABC Contractors"
            placeholderTextColor="#C9D0DC"
            value={formData.company}
            onChangeText={(text) => setFormData({ ...formData, company: text })}
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus?.()}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Email *
          </Text>
          <TextInput
            ref={emailRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
            }}
            placeholder="john@example.com"
            placeholderTextColor="#C9D0DC"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => phoneRef.current?.focus?.()}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Phone
          </Text>
          <TextInput
            ref={phoneRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
            }}
            placeholder="555-0100"
            placeholderTextColor="#C9D0DC"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => zipRef.current?.focus?.()}
            inputAccessoryViewID={
              Platform.OS === "ios" ? phoneAccessoryID : undefined
            }
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Trade *
          </Text>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Picker
              selectedValue={formData.trade}
              onValueChange={(value) =>
                setFormData({ ...formData, trade: value })
              }
              style={{ fontFamily: "Inter_400Regular" }}
            >
              {trades.map((trade) => (
                <Picker.Item key={trade} label={trade} value={trade} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            ZIP *
          </Text>
          <TextInput
            ref={zipRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
            }}
            placeholder="90210"
            placeholderTextColor="#C9D0DC"
            value={formData.zip}
            onChangeText={(text) => setFormData({ ...formData, zip: text })}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="next" // soft-tab to next field (iOS number-pad lacks return)
            blurOnSubmit={false}
            onSubmitEditing={() => notesRef.current?.focus?.()}
            inputAccessoryViewID={
              Platform.OS === "ios" ? zipAccessoryID : undefined
            }
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Notes
          </Text>
          <TextInput
            ref={notesRef}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
              height: 100,
              textAlignVertical: "top",
            }}
            placeholder="Tell us about your business..."
            placeholderTextColor="#C9D0DC"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* iOS-only soft Next bars for numeric keyboards */}
        {Platform.OS === "ios" && (
          <>
            <InputAccessoryView nativeID={phoneAccessoryID}>
              <View
                style={{
                  backgroundColor: "#F2F4F7",
                  borderTopWidth: 1,
                  borderTopColor: "#E4E8EC",
                  padding: 8,
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity
                  onPress={() => zipRef.current?.focus?.()}
                  style={{
                    backgroundColor: "#0095AE",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>

            <InputAccessoryView nativeID={zipAccessoryID}>
              <View
                style={{
                  backgroundColor: "#F2F4F7",
                  borderTopWidth: 1,
                  borderTopColor: "#E4E8EC",
                  padding: 8,
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity
                  onPress={() => notesRef.current?.focus?.()}
                  style={{
                    backgroundColor: "#0095AE",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          </>
        )}

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
          onPress={() => setConsentGiven(!consentGiven)}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: consentGiven ? "#007A3B" : "#E4E8EC",
              borderRadius: 4,
              backgroundColor: consentGiven ? "#007A3B" : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              marginTop: 2,
            }}
          >
            {consentGiven && (
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "bold" }}
              >
                ✓
              </Text>
            )}
          </View>
          <Text
            style={{
              flex: 1,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: "#414856",
              lineHeight: 18,
            }}
          >
            By submitting, I agree to the collection and use of my data as
            described in the{" "}
            <Text
              style={{ fontFamily: "Inter_600SemiBold", color: "#0095AE" }}
              onPress={() => router.push("/(tabs)/privacy")}
            >
              Privacy Policy and Terms of Service
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#9AA1AD" : "#007A3B",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
