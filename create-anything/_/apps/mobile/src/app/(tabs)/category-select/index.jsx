import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
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
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function CategorySelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const categories = useMemo(() => {
    const mapIcon = (name) => (Icons && Icons[name] ? Icons[name] : null);
    return [
      {
        id: "bathroom",
        name: "Bathroom",
        icon: mapIcon("Droplet"),
        color: "#0095AE",
      },
      {
        id: "kitchen",
        name: "Kitchen",
        icon: mapIcon("UtensilsCrossed"),
        color: "#007A3B",
      },
      { id: "roof", name: "Roof", icon: mapIcon("Home"), color: "#00454F" },
      { id: "hvac", name: "HVAC", icon: mapIcon("Wind"), color: "#9AA1AD" },
      {
        id: "electrical",
        name: "Electrical",
        icon: mapIcon("Zap"),
        color: "#F59E0B",
      },
      {
        id: "plumbing",
        name: "Plumbing",
        icon: mapIcon("Wrench"),
        color: "#3B82F6",
      },
      {
        id: "flooring",
        name: "Flooring",
        icon: mapIcon("Square"),
        color: "#8B5CF6",
      },
      {
        id: "bedroom",
        name: "Bedroom",
        icon: mapIcon("Bed"),
        color: "#EC4899",
      },
      {
        id: "windows_doors",
        name: "Windows & Doors",
        icon: mapIcon("DoorOpen"),
        color: "#EF4444",
      },
      {
        id: "foundation",
        name: "Foundation",
        icon: mapIcon("Building"),
        color: "#6B7280",
      },
      {
        id: "exterior",
        name: "Exterior/Siding",
        icon: mapIcon("TreePine"),
        color: "#059669",
      },
      { id: "garage", name: "Garage", icon: mapIcon("Car"), color: "#DC2626" },
    ];
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = () => {
    if (selectedCategory) {
      router.push({
        pathname: "/(tabs)/questions",
        params: { category: selectedCategory },
      });
    }
  };

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
            Choose Category
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
            marginBottom: 24,
          }}
        >
          Select the area you'd like to inspect
        </Text>

        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={{
                backgroundColor: isSelected ? category.color + "20" : "#FFFFFF",
                borderWidth: 2,
                borderColor: isSelected ? category.color : "#E4E8EC",
                borderRadius: 12,
                padding: 20,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: category.color + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                {Icon ? (
                  <Icon size={24} color={category.color} />
                ) : (
                  <Text style={{ color: category.color, fontWeight: "700" }}>
                    {category.name[0]}
                  </Text>
                )}
              </View>

              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  color: isSelected ? category.color : "#000000",
                  flex: 1,
                }}
              >
                {category.name}
              </Text>

              {isSelected && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: category.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                      color: "#FFFFFF",
                    }}
                  >
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
            backgroundColor: selectedCategory ? "#0095AE" : "#C9D0DC",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handleContinue}
          disabled={!selectedCategory}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
