import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image as RNImage,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as RNImagePicker from "expo-image-picker";
import useUpload from "@/utils/useUpload";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const PlusIcon = Icons?.Plus || null;
const ImageIcon = Icons?.Image || null;
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function AddPhotosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkId, category } = useLocalSearchParams();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  const [upload, { loading: uploading }] = useUpload();
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  const uploadAndSave = useCallback(
    async (asset) => {
      setError(null);
      const { url, error: upErr } = await upload({ reactNativeAsset: asset });
      if (upErr) {
        setError(upErr);
        return false;
      }

      const resp = await fetch("/api/swipecheck/photos/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId, url, category }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Failed to save photo");
        return false;
      }

      setPhotos((p) => [...p, { url }]);
      return true;
    },
    [checkId, category, upload],
  );

  const pickImage = useCallback(async () => {
    try {
      const result = await RNImagePicker.launchImageLibraryAsync({
        mediaTypes: RNImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await uploadAndSave(asset);
    } catch (e) {
      console.error("Image add error", e);
      setError("Failed to add photo");
    }
  }, [uploadAndSave]);

  // ADD: Support taking a photo with the camera
  const takePhoto = useCallback(async () => {
    try {
      const { status } = await RNImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera permission was denied. You can allow it in Settings.");
        return;
      }
      const result = await RNImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await uploadAndSave(asset);
    } catch (e) {
      console.error("Camera error", e);
      setError("Could not open camera");
    }
  }, [uploadAndSave]);

  const onAddPhotoPress = useCallback(() => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [pickImage, takePhoto]);

  const handleSkipOrContinue = async () => {
    try {
      setSaving(true);

      // Ensure checkId exists
      if (!checkId) {
        setError("Missing check ID. Please try starting the SwipeCheck again.");
        setSaving(false);
        return;
      }

      // Navigate to results with proper parameters
      router.replace({
        pathname: "/(tabs)/results",
        params: { checkId: String(checkId) },
      });
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Unable to continue. Please try again.");
      setSaving(false);
    }
  };

  if (!fontsLoaded) return null;

  const count = photos.length;
  const canAddMore = count < 5 && !uploading && !saving;

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
            Add Photos
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
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: "#7A8292",
            marginBottom: 16,
          }}
        >
          Photos help AI and contractors understand the issue better. You can
          add up to 5 photos for this SwipeCheck.
        </Text>

        {/* Camera/Photo Library Explanation */}
        <View
          style={{
            backgroundColor: "#EFF6FF",
            borderWidth: 1,
            borderColor: "#BFDBFE",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
              color: "#1E40AF",
              marginBottom: 4,
            }}
          >
            📷 Camera & Photo Access
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: "#1E40AF",
              lineHeight: 16,
            }}
          >
            We'll ask for camera and photo library access so you can add photos
            to your SwipeCheck. This helps our AI and contractors better
            understand property conditions. You can skip this step anytime.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {ImageIcon ? <ImageIcon size={18} color="#00454F" /> : null}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: "#00454F",
              marginLeft: 8,
            }}
          >
            {count} of 5 photos added
          </Text>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: "#FEE",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#C00",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {photos.map((p, idx) => (
            <RNImage
              key={idx}
              source={{ uri: p.url }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: "#EDEFF2",
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
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
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: canAddMore ? "#0095AE" : "#C9D0DC",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
            onPress={onAddPhotoPress}
            disabled={!canAddMore}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                {PlusIcon ? <PlusIcon size={18} color="#FFFFFF" /> : null}
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: "#FFFFFF",
                    marginLeft: 6,
                  }}
                >
                  Add Photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#00454F",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={handleSkipOrContinue}
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
    </View>
  );
}
