import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/utils/auth/useAuth";
import { loadIcons } from "@/utils/safeIcons";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [hasProperty, setHasProperty] = useState(true);
  const { auth, isReady } = useAuth();

  // Centralized safe icon loader
  const Icons = loadIcons();
  const HomeIcon = Icons?.Home || null;
  const FileTextIcon = Icons?.FileText || null;
  const UsersIcon = Icons?.Users || null;
  const LockIcon = Icons?.Lock || null;

  useEffect(() => {
    const load = async () => {
      try {
        const headers = {};
        if (auth?.jwt) headers["Authorization"] = `Bearer ${auth.jwt}`;
        const res = await fetch("/api/properties/my-property", { headers });
        if (res.status === 401 || res.status === 403) {
          setHasProperty(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setHasProperty(!!data);
        } else {
          setHasProperty(true); // default to unlocked if we can't tell
        }
      } catch (e) {
        setHasProperty(true);
      }
    };
    if (isReady) {
      load();
    }
  }, [auth?.jwt, isReady]);

  const TabIcon = ({ focused, color, Icon, fallback }) => (
    <View style={{ alignItems: "center" }}>
      {focused && (
        <View
          style={{
            position: "absolute",
            top: -8,
            width: 40,
            height: 2,
            backgroundColor: "#00454F",
            borderRadius: 1,
          }}
        />
      )}
      {Icon ? (
        <Icon size={24} color={color} />
      ) : (
        <Text style={{ color, fontWeight: focused ? "700" : "400" }}>
          {fallback}
        </Text>
      )}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E4E8EC",
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#00454F",
        tabBarInactiveTintColor: "#9AA1AD",
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              Icon={HomeIcon}
              fallback="H"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-home/index"
        options={{
          title: "My Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              Icon={FileTextIcon}
              fallback="MH"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contractors/index"
        options={{
          title: "Contractors",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    width: 40,
                    height: 2,
                    backgroundColor: "#00454F",
                    borderRadius: 1,
                  }}
                />
              )}
              <View>
                {UsersIcon ? (
                  <UsersIcon size={24} color={color} />
                ) : (
                  <Text style={{ color, fontWeight: focused ? "700" : "400" }}>
                    C
                  </Text>
                )}
                {!hasProperty && (
                  <View
                    style={{
                      position: "absolute",
                      right: -6,
                      top: -6,
                      backgroundColor: "#FFF",
                      borderRadius: 8,
                      padding: 1,
                    }}
                  >
                    {LockIcon ? (
                      <LockIcon size={12} color="#9AA1AD" />
                    ) : (
                      <Text style={{ color: "#9AA1AD", fontSize: 10 }}>L</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />
      {/* hide dynamic contractor profile route from tab bar */}
      <Tabs.Screen name="contractors/[id]" options={{ href: null }} />
      <Tabs.Screen name="didpid-create/index" options={{ href: null }} />
      <Tabs.Screen name="didpid-success/index" options={{ href: null }} />
      <Tabs.Screen name="swipecheck-intro/index" options={{ href: null }} />
      <Tabs.Screen name="category-select/index" options={{ href: null }} />
      <Tabs.Screen name="questions/index" options={{ href: null }} />
      <Tabs.Screen name="add-photos/index" options={{ href: null }} />
      <Tabs.Screen name="results/index" options={{ href: null }} />
      <Tabs.Screen name="contractor-info/index" options={{ href: null }} />
      <Tabs.Screen name="contractor-signup/index" options={{ href: null }} />
      <Tabs.Screen
        name="contractor-confirmation/index"
        options={{ href: null }}
      />
      <Tabs.Screen name="home-details/index" options={{ href: null }} />
    </Tabs>
  );
}
