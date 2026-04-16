import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";

// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const PhoneIcon = Icons?.Phone || null;
const MailIcon = Icons?.Mail || null;
const MapPinIcon = Icons?.MapPin || null;
const ShieldCheckIcon = Icons?.ShieldCheck || null;
const StarIcon = Icons?.Star || null;

function Stars({ rating }) {
  if (!rating) {
    return (
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
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
          fontSize: 13,
          color: "#7A8292",
        }}
      >
        {Number(rating).toFixed(1)}
      </Text>
    );
  }
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const filled = i < full || (i === full && half);
    return (
      <StarIcon
        key={i}
        size={16}
        color={filled ? "#F59E0B" : "#C9D0DC"}
        fill={filled ? "#F59E0B" : "none"}
      />
    );
  });
  return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
}

export default function ContractorProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ["contractor", id],
    queryFn: async () => {
      const res = await fetch(`/api/contractors/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to load contractor ${id}`);
      }
      return res.json();
    },
  });

  if (isLoading) {
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

  if (!data) return null;

  const {
    name,
    trade,
    zip,
    phone,
    email,
    rating,
    address,
    insured,
    photo_url,
    socials,
    contact_unlocked,
  } = data;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
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
            Contractor
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {photo_url ? (
            <Image
              source={{ uri: photo_url }}
              style={{ width: "100%", height: 180 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 120,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#EDEFF2",
              }}
            >
              <Text style={{ fontFamily: "Inter_500Medium", color: "#7A8292" }}>
                No photo
              </Text>
            </View>
          )}

          <View style={{ padding: 16 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 22,
                color: "#000",
                marginBottom: 4,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#00454F",
                marginBottom: 8,
              }}
            >
              {trade}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Stars rating={rating} />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
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
                {address ? address : `ZIP: ${zip}`}
              </Text>
            </View>

            {insured !== null && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                {ShieldCheckIcon ? (
                  <ShieldCheckIcon
                    size={16}
                    color={insured ? "#007A3B" : "#9AA1AD"}
                  />
                ) : null}
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: insured ? "#007A3B" : "#7A8292",
                    marginLeft: 6,
                  }}
                >
                  {insured ? "Carries insurance" : "Insurance not provided"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact and socials */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E4E8EC",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {contact_unlocked ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {phone && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#00454F",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                  onPress={() => Linking.openURL(`tel:${phone}`)}
                  activeOpacity={0.8}
                >
                  {PhoneIcon ? <PhoneIcon size={16} color="#FFF" /> : null}
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#FFF",
                      marginLeft: 6,
                    }}
                  >
                    Call
                  </Text>
                </TouchableOpacity>
              )}
              {email && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#E4E8EC",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                  onPress={() => Linking.openURL(`mailto:${email}`)}
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
          ) : (
            <View
              style={{
                backgroundColor: "#FFF7ED",
                borderWidth: 1,
                borderColor: "#FED7AA",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: "#9A3412",
                  marginBottom: 6,
                }}
              >
                Contact info locked
              </Text>
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
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={() => router.push("/(tabs)/didpid-create")}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#FFFFFF",
                  }}
                >
                  Claim DIDPID
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Socials */}
          {socials && (
            <View style={{ marginTop: 12, gap: 6 }}>
              {socials.website && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(socials.website)}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#00454F",
                    }}
                  >
                    Website
                  </Text>
                </TouchableOpacity>
              )}
              {socials.instagram && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(socials.instagram)}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#00454F",
                    }}
                  >
                    Instagram
                  </Text>
                </TouchableOpacity>
              )}
              {socials.facebook && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(socials.facebook)}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#00454F",
                    }}
                  >
                    Facebook
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
