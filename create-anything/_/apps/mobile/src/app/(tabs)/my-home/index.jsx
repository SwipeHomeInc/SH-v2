import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

const isProd =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "production") ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.EXPO_PUBLIC_CREATE_ENV === "production");

// Icons: production-safe centralized loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();

const HomeIcon = Icons?.Home || null;
const CheckCircleIcon = Icons?.CheckCircle || null;

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { useAuth } from "@/utils/auth/useAuth";
import { loadMaps } from "@/utils/safeMaps";

export default function MyHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();

  const { isReady, isAuthenticated, signIn } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [latestChecks, setLatestChecks] = useState([]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ⭐ SIGN-IN TRIGGER (fixes RootLayout crash)
  const [triggerSignIn, setTriggerSignIn] = useState(false);
  useEffect(() => {
    if (triggerSignIn) {
      signIn();
      setTriggerSignIn(false);
    }
  }, [triggerSignIn]);

  // ⭐ SAFE MAP LOADER via centralized util
  const Maps = loadMaps();
  const SafeMapView = Maps?.MapView ?? null;
  const SafeMarker = Maps?.Marker ?? null;

  // ⭐ LOAD PROPERTY
  const loadProperty = useCallback(async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      const response = await fetch("/api/properties/my-property");

      if (response.status === 401 || response.status === 403) {
        setUnauthorized(true);
        setProperty(null);
        setLatestChecks([]);
      } else if (response.ok) {
        const data = await response.json();
        setProperty(data || null);

        // Load SwipeCheck summary
        const cRes = await fetch("/api/swipecheck/latest-by-category");
        if (cRes.ok) {
          const cData = await cRes.json();
          setLatestChecks(cData.checks || []);
        } else {
          setLatestChecks([]);
        }
      } else {
        setProperty(null);
        setLatestChecks([]);
      }
    } catch (err) {
      console.error("Error loading property:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⭐ FOCUS SAFE LOADING (never updates during render)
  useEffect(() => {
    if (isFocused) {
      const id = setTimeout(() => loadProperty(), 0);
      return () => clearTimeout(id);
    }
  }, [isFocused, loadProperty]);

  if (!fontsLoaded) return null;

  // ⭐ FULLY SAFE UNAUTHORIZED BLOCK
  if (unauthorized && isReady && !isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
        <StatusBar style="dark" />
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
              color: "#000",
            }}
          >
            My Home
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 48,
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
            Please sign in to view your home
          </Text>

          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            You need an account to access your property dashboard.
          </Text>

          <TouchableOpacity
            onPress={() => setTriggerSignIn(true)}
            style={{
              backgroundColor: "#00454F",
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFF",
              }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
        <StatusBar style="dark" />
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
              color: "#000",
            }}
          >
            My Home
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 48,
          }}
        >
          {HomeIcon ? (
            <HomeIcon size={64} color="#C9D0DC" />
          ) : (
            <Text style={{ color: "#C9D0DC", fontSize: 48 }}>H</Text>
          )}

          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: "#414856",
              marginTop: 16,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No Property Yet
          </Text>

          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#7A8292",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Create your DIDPID to get started tracking your home
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/didpid-create")}
            style={{
              backgroundColor: "#00454F",
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFF",
              }}
            >
              Create My DIDPID
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const details = [];
  if (property?.bedrooms) details.push(`${property.bedrooms} beds`);
  if (property?.bathrooms) details.push(`${property.bathrooms} baths`);
  if (property?.square_feet)
    details.push(`${property.square_feet.toLocaleString()} sq ft`);
  if (property?.year_built) details.push(`Built ${property.year_built}`);
  const detailsLine = details.join(" • ");

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />

      <View
        style={{
          backgroundColor: "#F5F8FA",
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 28,
                color: "#000",
              }}
            >
              My Home
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#7A8292",
              }}
            >
              Your property dashboard
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/(tabs)/home-details")}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#0095AE",
              }}
            >
              Home Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Card */}
        <View
          style={{
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          {/* Address */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#00454F20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              {HomeIcon ? (
                <HomeIcon size={24} color="#00454F" />
              ) : (
                <Text style={{ color: "#00454F", fontSize: 22 }}>H</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
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
          </View>

          {/* DIDPID Block */}
          <View
            style={{
              backgroundColor: "#F5F8FA",
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: "#7A8292",
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

          {/* Details line */}
          {!!detailsLine && (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: "#414856",
                marginTop: 8,
              }}
            >
              {detailsLine}
            </Text>
          )}

          {/* MAP */}
          {property.latitude && property.longitude ? (
            <View style={{ marginTop: 12 }}>
              {SafeMapView && SafeMarker ? (
                <SafeMapView
                  style={{ height: 180, borderRadius: 12 }}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <SafeMarker
                    coordinate={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                    }}
                  />
                </SafeMapView>
              ) : (
                <View
                  style={{
                    height: 180,
                    borderRadius: 12,
                    backgroundColor: "#EEE",
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

          {/* Last Check */}
          {property.last_check && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#E4E8EC",
              }}
            >
              {CheckCircleIcon ? (
                <CheckCircleIcon size={16} color="#007A3B" />
              ) : (
                <Text style={{ color: "#007A3B", fontSize: 16 }}>•</Text>
              )}
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: "#7A8292",
                  marginLeft: 8,
                }}
              >
                Last check: {new Date(property.last_check).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Latest Checks */}
        {latestChecks.length > 0 && (
          <View
            style={{
              backgroundColor: "#FFF",
              borderWidth: 1,
              borderColor: "#E4E8EC",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                marginBottom: 12,
                color: "#000",
              }}
            >
              Latest SwipeCheck by Area
            </Text>

            {latestChecks.map((row) => (
              <TouchableOpacity
                key={row.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/results",
                    params: { checkId: String(row.id) },
                  })
                }
                activeOpacity={0.8}
                style={{ flexDirection: "row", marginBottom: 10 }}
              >
                {row.thumb_url ? (
                  <RNImage
                    source={{ uri: row.thumb_url }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: "#EDEFF2",
                      marginRight: 10,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: "#F5F8FA",
                      marginRight: 10,
                    }}
                  />
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#000",
                    }}
                  >
                    {row.category.charAt(0).toUpperCase() +
                      row.category.slice(1)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      color: "#7A8292",
                    }}
                  >
                    {row.condition} — checked on{" "}
                    {new Date(row.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: "#0095AE",
                  }}
                >
                  View
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* SwipeCheck Button */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/swipecheck-intro")}
          style={{
            backgroundColor: "#0095AE",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFF",
            }}
          >
            Run SwipeCheck Lite Again
          </Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 24,
            borderTopWidth: 1,
            borderTopColor: "#E4E8EC",
            paddingTop: 16,
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => router.push("/(tabs)/privacy")}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#7A8292",
              }}
            >
              Privacy & Terms
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
