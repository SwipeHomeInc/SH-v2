import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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

export default function HomeDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    year_built: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Refs for soft-tab navigation
  const bedroomsRef = useRef(null);
  const bathroomsRef = useRef(null);
  const sqftRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/properties/my-property");
        if (res.ok) {
          const data = await res.json();
          setProperty(data);
          setForm({
            bedrooms: data?.bedrooms?.toString?.() || "",
            bathrooms: data?.bathrooms?.toString?.() || "",
            square_feet: data?.square_feet?.toString?.() || "",
            year_built: data?.year_built?.toString?.() || "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        bedrooms: form.bedrooms !== "" ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms !== "" ? Number(form.bathrooms) : null,
        square_feet: form.square_feet !== "" ? Number(form.square_feet) : null,
        year_built: form.year_built !== "" ? Number(form.year_built) : null,
      };
      const res = await fetch("/api/properties/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      router.back();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F5F8FA",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#00454F" />
      </View>
    );
  }

  // Guard: if no property found, show a message
  if (!property) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
        <StatusBar style="dark" />
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
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 20,
                  color: "#00454F",
                  marginRight: 8,
                }}
              >
                Back
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
              Home Details
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: "#414856",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No property found
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
              textAlign: "center",
            }}
          >
            Please claim your DIDPID first from the home screen.
          </Text>
        </View>
      </View>
    );
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
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 20,
                color: "#00454F",
                marginRight: 8,
              }}
            >
              Back
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
            Home Details
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
      >
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#7A8292",
              marginBottom: 6,
            }}
          >
            Address
          </Text>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#000",
            }}
          >
            {property.address}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
            }}
          >
            {property.city}, {property.state} {property.zip}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#F5F8FA",
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              color: "#7A8292",
              marginBottom: 4,
            }}
          >
            DIDPID
          </Text>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#00454F",
            }}
          >
            {property.didpid_code}
          </Text>
        </View>

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

        {/* Bedrooms */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Bedrooms
          </Text>
          <TextInput
            ref={bedroomsRef}
            value={form.bedrooms}
            onChangeText={(t) => setForm({ ...form, bedrooms: t })}
            keyboardType="number-pad"
            placeholder="e.g. 3"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => bathroomsRef.current?.focus?.()}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000",
            }}
          />
        </View>

        {/* Bathrooms */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Bathrooms
          </Text>
          <TextInput
            ref={bathroomsRef}
            value={form.bathrooms}
            onChangeText={(t) => setForm({ ...form, bathrooms: t })}
            keyboardType="decimal-pad"
            placeholder="e.g. 2.5"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => sqftRef.current?.focus?.()}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000",
            }}
          />
        </View>

        {/* Square Feet */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Square feet
          </Text>
          <TextInput
            ref={sqftRef}
            value={form.square_feet}
            onChangeText={(t) => setForm({ ...form, square_feet: t })}
            keyboardType="number-pad"
            placeholder="e.g. 1600"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => yearRef.current?.focus?.()}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000",
            }}
          />
        </View>

        {/* Year Built */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Year built
          </Text>
          <TextInput
            ref={yearRef}
            value={form.year_built}
            onChangeText={(t) => setForm({ ...form, year_built: t })}
            keyboardType="number-pad"
            placeholder="e.g. 1998"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={onSave}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000",
            }}
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: saving ? "#9AA1AD" : "#00454F",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
