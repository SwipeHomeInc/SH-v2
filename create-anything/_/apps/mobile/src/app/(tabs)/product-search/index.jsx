import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function ProductSearchScreen() {
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams();
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // Use Product Search integration (lightweight)
        const res = await fetch(
          `/integrations/product-search/search?q=${encodeURIComponent(String(q || "home repair"))}`,
        );
        if (res.ok) {
          const json = await res.json();
          setItems(json && json.data ? json.data.slice(0, 8) : []);
        }
      } catch (e) {
        console.error("product search failed", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q]);

  if (!fontsLoaded) return null;

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
            <Text style={{ color: "#00454F", fontSize: 24 }}>{"<"}</Text>
          )}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 20,
              color: "#00454F",
              marginLeft: 8,
            }}
          >
            Materials for this job
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: "#7A8292",
            marginTop: 6,
          }}
        >
          Suggested search: {String(q || "").slice(0, 80)}
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#00454F" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          data={items}
          keyExtractor={(item) => item.product_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E4E8EC",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
              onPress={() => {
                const url =
                  item.product_page_url || item.product_offers_page_url;
                if (url) {
                  Linking.openURL(url);
                }
              }}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: "#000",
                  marginBottom: 6,
                }}
                numberOfLines={2}
              >
                {item.product_title}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: "#7A8292",
                }}
                numberOfLines={2}
              >
                {item.offer?.store_name || "View offers"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text
                style={{ fontFamily: "Inter_400Regular", color: "#7A8292" }}
              >
                No results found.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
