import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
// Replace eager lucide imports with centralized safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const CheckCircleIcon = Icons?.CheckCircle || null;
const AlertTriangleIcon = Icons?.AlertTriangle || null;
const XCircleIcon = Icons?.XCircle || null;
const PhoneIcon = Icons?.Phone || null;
const MailIcon = Icons?.Mail || null;
const LockIcon = Icons?.Lock || null;

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const checkId = params.checkId;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadResults();
  }, [checkId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/swipecheck/results?checkId=${checkId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/swipecheck/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId }),
      });

      if (response.ok) {
        router.replace("/(tabs)/my-home");
      }
    } catch (error) {
      console.error("Error saving results:", error);
    } finally {
      setSaving(false);
    }
  };

  // Helper to render a contractor section with title and message
  const renderContractorSection = (title, message, list) => {
    if (!list || list.length === 0) return null;
    return (
      <>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 20,
            color: "#000000",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        {message ? (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: "#7A8292",
              marginBottom: 12,
            }}
          >
            {message}
          </Text>
        ) : null}
        {list.map((contractor) => (
          <View
            key={contractor.id}
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
                fontSize: 16,
                color: "#000000",
                marginBottom: 4,
              }}
            >
              {contractor.name}
            </Text>
            <View
              style={{
                backgroundColor: "#00454F20",
                paddingHorizontal: 10,
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

            {/* Area/ZIP line - hide ZIP before DIDPID, show only after */}
            {results.unlock_required ? (
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
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#7A8292",
                  marginBottom: 12,
                }}
              >
                ZIP: {contractor.zip}
              </Text>
            )}

            {/* Contact locked state vs unlocked buttons */}
            {results.unlock_required ? (
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
                    marginBottom: 8,
                  }}
                  onPress={() => router.push("/(tabs)/didpid-create")}
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
                <TouchableOpacity
                  onPress={() => router.push(`/contractors/${contractor.id}`)}
                  activeOpacity={0.8}
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
            ) : (
              <View style={{ gap: 8 }}>
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
                      {PhoneIcon ? (
                        <PhoneIcon size={16} color="#FFFFFF" />
                      ) : null}
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
                      onPress={() =>
                        Linking.openURL(`mailto:${contractor.email}`)
                      }
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
                  onPress={() => router.push(`/contractors/${contractor.id}`)}
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
        ))}
      </>
    );
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

  if (!results) {
    return null;
  }

  const getConditionIcon = () => {
    switch (results.condition) {
      case "Good":
        return CheckCircleIcon ? (
          <CheckCircleIcon size={32} color="#007A3B" />
        ) : null;
      case "Fair":
        return AlertTriangleIcon ? (
          <AlertTriangleIcon size={32} color="#F59E0B" />
        ) : null;
      case "Needs Attention":
        return XCircleIcon ? <XCircleIcon size={32} color="#DC2626" /> : null;
      default:
        return null;
    }
  };

  const getConditionColor = () => {
    switch (results.condition) {
      case "Good":
        return "#007A3B";
      case "Fair":
        return "#F59E0B";
      case "Needs Attention":
        return "#DC2626";
      default:
        return "#7A8292";
    }
  };

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
          Your Results
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
          }}
        >
          SwipeCheck Lite completed
        </Text>
        {/* QUICK LINK: Go to My Home */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/my-home")}
          style={{ position: "absolute", right: 24, top: insets.top + 16 }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: "#00454F",
            }}
          >
            My Home
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Condition Summary */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: getConditionColor() + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {getConditionIcon()}
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              color: getConditionColor(),
              marginBottom: 4,
            }}
          >
            {results.condition}
          </Text>
          {results.summary_text ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#7A8292",
                textAlign: "center",
              }}
            >
              {results.summary_text}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#7A8292",
                textAlign: "center",
              }}
            >
              Overall condition
            </Text>
          )}
        </View>

        {/* Findings */}
        {results.key_findings && results.key_findings.length > 0 && (
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
              What we're seeing
            </Text>
            {results.key_findings.map((finding, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  marginBottom:
                    index < results.key_findings.length - 1 ? 12 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: "#414856",
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: "#414856",
                    flex: 1,
                    lineHeight: 22,
                  }}
                >
                  {finding}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Guidance */}
        {results.gentle_guidance && results.gentle_guidance.length > 0 && (
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
                color: "#000",
                marginBottom: 12,
              }}
            >
              What you can do next
            </Text>
            {results.gentle_guidance.map((g, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  marginBottom:
                    idx < results.gentle_guidance.length - 1 ? 12 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: "#414856",
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: "#414856",
                    flex: 1,
                    lineHeight: 22,
                  }}
                >
                  {g}
                </Text>
              </View>
            ))}
            {(results.recommended_contractor_type ||
              results.suggested_timeframe) && (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#7A8292",
                  marginTop: 8,
                }}
              >
                {results.recommended_contractor_type
                  ? `Recommended: ${results.recommended_contractor_type}`
                  : ""}
                {results.recommended_contractor_type &&
                results.suggested_timeframe
                  ? " • "
                  : ""}
                {results.suggested_timeframe
                  ? `Timeframe: ${results.suggested_timeframe}`
                  : ""}
              </Text>
            )}
          </View>
        )}

        {/* Recommended Contractors sections using grouped matches */}
        {renderContractorSection(
          "Local Swipe Contractors",
          results.local_swipe_contractors &&
            results.local_swipe_contractors.length
            ? "We found Swipe Contractors in your ZIP who can help with this."
            : null,
          results.local_swipe_contractors,
        )}

        {(!results.local_swipe_contractors ||
          results.local_swipe_contractors.length <= 1) &&
          renderContractorSection(
            "Nearby Swipe Contractors",
            results.nearby_swipe_contractors &&
              results.nearby_swipe_contractors.length
              ? `We don't have a Swipe Contractor in your ZIP yet, but these pros work nearby and may serve your home.`
              : null,
            results.nearby_swipe_contractors,
          )}

        {/* External providers section remains */}
        {!results.unlock_required &&
          results.nearby_pros &&
          results.nearby_pros.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 20,
                  color: "#000000",
                  marginBottom: 4,
                }}
              >
                Nearby Pros (External)
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: "#7A8292",
                  marginBottom: 12,
                }}
              >
                These are nearby pros from outside the Swipe network.
              </Text>
              {results.nearby_pros.map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#E4E8EC",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      color: "#000",
                      marginBottom: 4,
                    }}
                  >
                    {p.name}{" "}
                    <Text
                      style={{
                        color: "#7A8292",
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 12,
                      }}
                    >
                      (External)
                    </Text>
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      color: "#00454F",
                      marginBottom: 6,
                    }}
                  >
                    {p.trade}
                  </Text>
                  {!!p.address && (
                    <Text
                      style={{
                        fontFamily: "Inter_400Regular",
                        fontSize: 13,
                        color: "#7A8292",
                      }}
                    >
                      {p.address}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

        {/* Friendly fallback when no matches at all */}
        {(!results.local_swipe_contractors ||
          results.local_swipe_contractors.length === 0) &&
          (!results.nearby_swipe_contractors ||
            results.nearby_swipe_contractors.length === 0) &&
          (!results.nearby_pros || results.nearby_pros.length === 0) && (
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
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#414856",
                }}
              >
                We don't have contractors in your area yet, but your SwipeCheck
                and DIDPID are saved. You'll be the first to know when we expand
                into your ZIP.
              </Text>
            </View>
          )}

        {/* Photos */}
        {results.photos && results.photos.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                color: "#000",
                marginBottom: 12,
              }}
            >
              Photos from this SwipeCheck
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {results.photos.map((p) => (
                <RNImage
                  key={p.id}
                  source={{ uri: p.url }}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 8,
                    backgroundColor: "#EDEFF2",
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E4E8EC",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: saving ? "#9AA1AD" : "#007A3B",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handleSave}
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
              Save to My Home
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
