import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
// ADD: auth imports so we can attach JWT and prompt sign-in if needed
import { useAuth } from "@/utils/auth/useAuth";
import { useAuthModal } from "@/utils/auth/store";
import { loadMaps } from "@/utils/safeMaps";

export default function DidpidCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, isAuthenticated, auth, signIn } = useAuth();
  const { open } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
  });
  // Add refs for next-field navigation
  const addressRef = useRef(null);
  const unitRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const zipRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  // add formatted address captured from Google
  const [formattedAddress, setFormattedAddress] = useState("");
  // ADD: session token for Places to improve quality and billing
  const [sessionToken] = useState(() => Math.random().toString(36).slice(2));
  // Track if Google key is present
  // We now proxy Google requests through our backend, so no key is needed on-device
  const googleKey = true;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [locationConsent, setLocationConsent] = useState(false);

  // Safe, centralized maps loader
  const Maps = loadMaps();
  const SafeMapView = Maps?.MapView ?? null;
  const SafeMarker = Maps?.Marker ?? null;

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPredictions();
    }, 300);
    return () => clearTimeout(t);
  }, [formData.address]);

  const fetchPredictions = async () => {
    try {
      const input = formData.address?.trim();
      if (!input || input.length < 3) {
        setPredictions([]);
        return;
      }
      // Call backend proxy to avoid client-side key and platform restrictions
      const url = `/api/google/places/autocomplete?input=${encodeURIComponent(
        input,
      )}&sessiontoken=${sessionToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ||
            `When fetching ${url}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      setPredictions(data.predictions?.slice(0, 5) || []);
    } catch (e) {
      console.error("autocomplete failed", e);
      // Do not block manual typing; just clear predictions
      setPredictions([]);
    }
  };

  const onSelectPrediction = async (placeId, description) => {
    try {
      const url = `/api/google/places/details?place_id=${encodeURIComponent(
        placeId,
      )}&fields=address_component,geometry&sessiontoken=${sessionToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ||
            `When fetching ${url}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      const comps = data.result?.address_components || [];
      const get = (type) =>
        comps.find((c) => c.types.includes(type))?.long_name || "";
      const streetNumber = get("street_number");
      const route = get("route");
      const city =
        get("locality") ||
        get("sublocality") ||
        get("administrative_area_level_2");
      const state =
        comps.find((c) => c.types.includes("administrative_area_level_1"))
          ?.short_name || "";
      const zip = get("postal_code");
      const address = [streetNumber, route].filter(Boolean).join(" ");
      const lat = data.result?.geometry?.location?.lat || null;
      const lng = data.result?.geometry?.location?.lng || null;
      setCoords({ latitude: lat, longitude: lng });
      setFormData({ ...formData, address, city, state, zip });
      setFormattedAddress(description || "");
      setPredictions([]);
    } catch (e) {
      console.error("place details failed", e);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // If not authenticated, prompt sign-in first
      if (isReady && !isAuthenticated) {
        // Defer signIn to avoid setState during render
        setTimeout(() => signIn(), 0);
        setLoading(false);
        return;
      }

      const headers = { "Content-Type": "application/json" };
      if (auth?.jwt) {
        headers["Authorization"] = `Bearer ${auth.jwt}`;
      }

      // switch to claim-or-create endpoint and pass structured fields
      const response = await fetch("/api/properties/claim-or-create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          address: formData.address,
          unit: formData.unit,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zip,
          latitude: coords.latitude,
          longitude: coords.longitude,
          formatted_address: formattedAddress,
        }),
      });

      if (!response.ok) {
        // If unauthorized, prompt auth modal
        if (response.status === 401 || response.status === 403) {
          // Defer signIn to avoid setState during render
          setTimeout(() => signIn(), 0);
          setLoading(false);
          return;
        }
        const err = await response.json().catch(() => null);
        const msg = err?.error || "Failed to claim or create DIDPID";
        throw new Error(msg);
      }

      const data = await response.json();

      // Navigate to DIDPID success screen with details
      const didpid = data?.didpid?.didpid_code;
      const propertyId = data?.property?.id;
      const addr = data?.formatted_address;

      router.replace({
        pathname: "/(tabs)/didpid-success",
        params: {
          didpid: didpid || "",
          address: addr || "",
          propertyId: String(propertyId || ""),
        },
      });
    } catch (err) {
      console.error("Error creating/claiming DIDPID:", err);
      setError(err?.message || "Failed to create DIDPID. Please try again.");
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
            Claim Your DIDPID™
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
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
            marginBottom: 16,
          }}
        >
          Enter your property details to claim your unique DIDPID
        </Text>

        {/* Location Data Consent - Interactive Checkbox */}
        <TouchableOpacity
          style={{
            backgroundColor: "#EFF6FF",
            borderWidth: 1,
            borderColor: "#BFDBFE",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
          onPress={() => setLocationConsent(!locationConsent)}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: locationConsent ? "#1E40AF" : "#BFDBFE",
              backgroundColor: locationConsent ? "#1E40AF" : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              marginTop: 2,
            }}
          >
            {locationConsent && (
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "bold" }}
              >
                ✓
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
                color: "#1E40AF",
                marginBottom: 4,
              }}
            >
              📍 I agree to share my property location data
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#1E40AF",
                lineHeight: 16,
              }}
            >
              I understand and agree that my property's location (determined via
              Google Maps) will be used to match me with nearby contractors and
              provide location-specific recommendations. We do not track your
              personal device location.
            </Text>
          </View>
        </TouchableOpacity>

        {error && (
          <View
            style={{
              backgroundColor: "#FFF8E1",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#FFE082",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: "#8A6D3B",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Address */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Address *
          </Text>
          <TextInput
            ref={addressRef}
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
            placeholder="123 Main Street"
            placeholderTextColor="#9AA1AD"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => unitRef.current?.focus?.()}
          />
          {!!predictions.length && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E4E8EC",
                borderRadius: 8,
                marginTop: 6,
              }}
            >
              {predictions.map((p) => (
                <TouchableOpacity
                  key={p.place_id}
                  onPress={() => onSelectPrediction(p.place_id, p.description)}
                  style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 14,
                      color: "#414856",
                    }}
                  >
                    {p.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* ADD: Map preview once we have coordinates */}
          {coords.latitude && coords.longitude ? (
            <View style={{ marginTop: 12 }}>
              {SafeMapView && SafeMarker ? (
                <SafeMapView
                  style={{ height: 160, borderRadius: 12 }}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <SafeMarker
                    coordinate={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    }}
                  />
                </SafeMapView>
              ) : (
                <View
                  style={{
                    height: 160,
                    borderRadius: 12,
                    backgroundColor: "#EDEFF2",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E4E8EC",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      color: "#7A8292",
                    }}
                  >
                    Map preview unavailable
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Unit */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            Unit (Optional)
          </Text>
          <TextInput
            ref={unitRef}
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
            placeholder="Apt 4B"
            placeholderTextColor="#9AA1AD"
            value={formData.unit}
            onChangeText={(text) => setFormData({ ...formData, unit: text })}
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => cityRef.current?.focus?.()}
          />
        </View>

        {/* City */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            City *
          </Text>
          <TextInput
            ref={cityRef}
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
            placeholder="Los Angeles"
            placeholderTextColor="#9AA1AD"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            autoCorrect={false}
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => stateRef.current?.focus?.()}
          />
        </View>

        {/* State */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#414856",
              marginBottom: 8,
            }}
          >
            State *
          </Text>
          <TextInput
            ref={stateRef}
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
            placeholder="CA"
            placeholderTextColor="#9AA1AD"
            value={formData.state}
            onChangeText={(text) => setFormData({ ...formData, state: text })}
            maxLength={2}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next" // soft-tab to next field
            blurOnSubmit={false}
            onSubmitEditing={() => zipRef.current?.focus?.()}
          />
        </View>

        {/* ZIP */}
        <View style={{ marginBottom: 32 }}>
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
            placeholderTextColor="#9AA1AD"
            value={formData.zip}
            onChangeText={(text) => setFormData({ ...formData, zip: text })}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor:
              loading || !locationConsent ? "#9AA1AD" : "#00454F",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handleSubmit}
          disabled={loading || !locationConsent}
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
              Save & Generate DIDPID
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
