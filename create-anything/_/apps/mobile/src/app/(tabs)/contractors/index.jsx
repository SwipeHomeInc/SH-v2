import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
// Lazy-load icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
import { loadMaps } from "@/utils/safeMaps";
const Icons = loadIcons();
const PhoneIcon = Icons?.Phone || null;
const MailIcon = Icons?.Mail || null;
const MapPinIcon = Icons?.MapPin || null;
const LockIcon = Icons?.Lock || null;
const StarIcon = Icons?.Star || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

function Stars({ rating }) {
  if (!rating) {
    return (
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          color: "#7A8292",
        }}
      >
        No rating yet
      </Text>
    );
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  if (!StarIcon) {
    return (
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          color: "#7A8292",
        }}
      >
        {Number(rating).toFixed(1)}
      </Text>
    );
  }
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <StarIcon
            key={i}
            size={14}
            color={filled ? "#F59E0B" : "#C9D0DC"}
            fill={filled ? "#F59E0B" : "none"}
          />
        );
      })}
    </View>
  );
}

const ContractorCard = ({ contractor, unlocked, onClaim, onViewProfile }) => (
  <View
    style={{
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E4E8EC",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}
  >
    <Text
      style={{
        fontFamily: "Inter_700Bold",
        fontSize: 18,
        color: "#000000",
        marginBottom: 4,
      }}
    >
      {contractor.name}
    </Text>

    <View
      style={{
        backgroundColor: "#00454F20",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          color: "#00454F",
        }}
      >
        {contractor.trade}
      </Text>
    </View>

    {/* Rating row */}
    <View style={{ marginBottom: 8 }}>
      <Stars rating={contractor.rating} />
    </View>

    {/* Area line: locked shows generic text; unlocked shows ZIP */}
    {unlocked ? (
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        {MapPinIcon ? <MapPinIcon size={16} color="#7A8292" /> : null}
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
            marginLeft: 6,
          }}
        >
          ZIP: {contractor.zip}
        </Text>
      </View>
    ) : (
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          color: "#7A8292",
          marginBottom: 12,
        }}
      >
        Serving your area
      </Text>
    )}

    {/* Locked inline banner vs unlocked contact buttons */}
    {!unlocked ? (
      <View
        style={{
          backgroundColor: "#FFF7ED",
          borderWidth: 1,
          borderColor: "#FED7AA",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          {LockIcon ? <LockIcon size={14} color="#9A3412" /> : null}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
              color: "#9A3412",
              marginLeft: 6,
            }}
          >
            Contact info locked
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#9A3412",
            marginBottom: 8,
          }}
        >
          Claim your DIDPID to contact this contractor directly
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#9A3412",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            alignItems: "center",
          }}
          onPress={onClaim}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
              color: "#FFFFFF",
            }}
          >
            Claim DIDPID
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={{ gap: 8, marginTop: 4 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {contractor.phone && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#00454F",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => Linking.openURL(`tel:${contractor.phone}`)}
              activeOpacity={0.8}
            >
              {PhoneIcon ? <PhoneIcon size={16} color="#FFFFFF" /> : null}
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#FFFFFF",
                  marginLeft: 6,
                }}
              >
                Call
              </Text>
            </TouchableOpacity>
          )}

          {contractor.email && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E4E8EC",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => Linking.openURL(`mailto:${contractor.email}`)}
              activeOpacity={0.8}
            >
              {MailIcon ? <MailIcon size={16} color="#00454F" /> : null}
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#00454F",
                  marginLeft: 6,
                }}
              >
                Email
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={onViewProfile}
          activeOpacity={0.8}
          style={{ alignSelf: "flex-start" }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: "#00454F",
            }}
          >
            View profile
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export default function ContractorsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [localContractors, setLocalContractors] = useState([]);
  const [nearbyContractors, setNearbyContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockRequired, setUnlockRequired] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [coords, setCoords] = useState({}); // zip -> {lat,lng}

  // --- SAFE react-native-maps loader via safe util ---
  const Maps = loadMaps();
  const SafeMapView = Maps?.MapView ?? null;
  const SafeMarker = Maps?.Marker ?? null;

  const loadContractors = useCallback(async () => {
    try {
      setLoading(true);
      setUnlockRequired(false);
      const response = await fetch("/api/contractors/list");
      if (response.ok) {
        const data = await response.json();
        const locals = data.local_swipe_contractors || [];
        const nearbys = data.nearby_swipe_contractors || [];
        setLocalContractors(locals);
        setNearbyContractors(nearbys);
        // geocode distinct zips (best-effort) across both groups via backend proxy
        const all = [...locals, ...nearbys];
        const zips = [...new Set(all.map((c) => c.zip).filter(Boolean))].slice(
          0,
          20,
        );
        const results = {};
        for (const z of zips) {
          try {
            // Call backend proxy instead of Google directly
            const url = `/api/google/geocode?address=${encodeURIComponent(z)}`;
            const res = await fetch(url);
            if (res.ok) {
              const j = await res.json();
              if (j.latitude && j.longitude) {
                results[z] = { latitude: j.latitude, longitude: j.longitude };
              }
            }
          } catch {}
        }
        setCoords(results);
      } else if (response.status === 401 || response.status === 403) {
        // No DIDPID yet or not authorized: show locked preview style
        setUnlockRequired(true);
        setLocalContractors([]);
        setNearbyContractors([]);
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContractors();
    }, [loadContractors]),
  );

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
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

  // compute initial region (fallback to USA center)
  const initialRegion = {
    latitude: 39.5,
    longitude: -98.35,
    latitudeDelta: 40,
    longitudeDelta: 40,
  };

  const lockedPreview = [
    { id: "p1", name: "Local Plumbing Pro", trade: "Plumbing" },
    { id: "r1", name: "Local Roofing Pro", trade: "Roofing" },
    { id: "h1", name: "Local HVAC Pro", trade: "HVAC" },
    { id: "e1", name: "Local Electrician", trade: "Electrical" },
    { id: "g1", name: "Local General Contractor", trade: "General Contractor" },
  ];

  const anyUnlocked = !unlockRequired;
  const combinedForMap = anyUnlocked
    ? [...localContractors, ...nearbyContractors]
    : [];

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
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            color: "#000000",
            marginBottom: 4,
          }}
        >
          Contractors
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
          }}
        >
          Connect with trusted professionals
        </Text>
      </View>

      {/* Map (only show when unlocked and we have real contractors) */}
      {anyUnlocked && combinedForMap.length > 0 && (
        <View
          style={{
            height: 220,
            marginHorizontal: 24,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            marginBottom: 12,
          }}
        >
          {SafeMapView && SafeMarker ? (
            <SafeMapView style={{ flex: 1 }} initialRegion={initialRegion}>
              {combinedForMap.map((c) => {
                const pos = coords[c.zip];
                if (!pos) return null;
                return (
                  <SafeMarker
                    key={c.id}
                    coordinate={pos}
                    title={c.name}
                    description={`${c.trade} • ${c.zip}`}
                  />
                );
              })}
            </SafeMapView>
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#EDEFF2",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  color: "#7A8292",
                }}
              >
                Map unavailable
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Local section */}
        {!unlockRequired && localContractors.length > 0 && (
          <>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#000000",
                marginBottom: 4,
              }}
            >
              Local Swipe Contractors
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: "#7A8292",
                marginBottom: 12,
              }}
            >
              We found Swipe Contractors in your ZIP who can help with this.
            </Text>
            {localContractors.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                unlocked={!unlockRequired}
                onClaim={() => router.push("/(tabs)/didpid-create")}
                onViewProfile={() =>
                  router.push(`/contractors/${contractor.id}`)
                }
              />
            ))}
          </>
        )}

        {/* Nearby section */}
        {!unlockRequired && nearbyContractors.length > 0 && (
          <>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#000000",
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              Nearby Swipe Contractors
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: "#7A8292",
                marginBottom: 12,
              }}
            >
              We don't have a Swipe Contractor in your ZIP yet, but these pros
              work nearby and may serve your home.
            </Text>
            {nearbyContractors.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                unlocked={!unlockRequired}
                onClaim={() => router.push("/(tabs)/didpid-create")}
                onViewProfile={() =>
                  router.push(`/contractors/${contractor.id}`)
                }
              />
            ))}
          </>
        )}

        {/* Locked preview when user has no DIDPID */}
        {unlockRequired && (
          <>
            {lockedPreview.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                unlocked={false}
                onClaim={() => router.push("/(tabs)/didpid-create")}
                onViewProfile={() => {}}
              />
            ))}
          </>
        )}

        {/* Friendly fallback when nothing found */}
        {!unlockRequired &&
          localContractors.length === 0 &&
          nearbyContractors.length === 0 && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E4E8EC",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#414856",
                }}
              >
                We don't have contractors in your area yet, but your DIDPID is
                saved. You'll be the first to know when we expand into your ZIP.
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
}
