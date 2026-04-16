import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
// Lazy-load lucide icons via safe loader
import { loadIcons } from "@/utils/safeIcons";
const Icons = loadIcons();
const ChevronLeftIcon = Icons?.ChevronLeft || null;
const ChevronRightIcon = Icons?.ChevronRight || null;
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
import authenticatedFetch from "@/utils/authenticatedFetch";

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadQuestions();
  }, [category]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions/list?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const currentQuestion = questions[currentIndex];
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);

      // Debug logging
      console.log("SUBMIT STARTED - handleSubmit called");
      Alert.alert("Debug", "handleSubmit function was called");

      console.log("Submitting SwipeCheck:", {
        category,
        answers,
        mode: "lite",
      });

      const response = await authenticatedFetch("/api/swipecheck/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers, mode: "lite" }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", errorData);
        Alert.alert(
          "Error",
          `Failed to submit SwipeCheck: ${errorData.error || "Unknown error"}`,
        );
        return;
      }

      const data = await response.json();
      console.log("SwipeCheck submitted successfully:", data);

      if (!data.checkId) {
        console.error("No checkId returned from API");
        Alert.alert("Error", "No check ID received. Please try again.");
        return;
      }

      console.log("Navigating to add-photos with checkId:", data.checkId);

      router.replace({
        pathname: "/(tabs)/add-photos",
        params: { checkId: String(data.checkId), category },
      });
    } catch (error) {
      console.error("Error submitting check:", error);
      Alert.alert("Network Error", `${error.message || "Please try again"}`);
    } finally {
      setSubmitting(false);
    }
  }, [category, answers, router]);

  // Alternative function that goes straight to results (bypass photos)
  const handleSkipToResults = useCallback(async () => {
    try {
      setSubmitting(true);

      console.log("SKIP TO RESULTS - Submitting SwipeCheck:", {
        category,
        answers,
        mode: "lite",
      });

      const response = await authenticatedFetch("/api/swipecheck/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers, mode: "lite" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert(
          "Error",
          `Failed to submit SwipeCheck: ${errorData.error || "Unknown error"}`,
        );
        return;
      }

      const data = await response.json();

      if (!data.checkId) {
        Alert.alert("Error", "No check ID received. Please try again.");
        return;
      }

      // Go directly to results
      router.replace({
        pathname: "/(tabs)/results",
        params: { checkId: String(data.checkId) },
      });
    } catch (error) {
      console.error("Error submitting check:", error);
      Alert.alert("Network Error", `${error.message || "Please try again"}`);
    } finally {
      setSubmitting(false);
    }
  }, [category, answers, router]);

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

  if (questions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F8FA" }}>
        <StatusBar style="dark" />
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
            }}
          >
            No questions available for this category
          </Text>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canProceed = currentAnswer !== undefined;

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
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
          activeOpacity={0.7}
        >
          {ChevronLeftIcon ? (
            <ChevronLeftIcon size={24} color="#00454F" />
          ) : (
            <Text style={{ color: "#00454F", fontSize: 24, marginRight: 8 }}>
              {"<"}
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
            SwipeCheck Lite
          </Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#E4E8EC",
              borderRadius: 2,
              marginRight: 12,
            }}
          >
            <View
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                height: "100%",
                backgroundColor: "#0095AE",
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: "#7A8292",
            }}
          >
            {currentIndex + 1} of {questions.length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 24,
            color: "#000000",
            marginBottom: 24,
            lineHeight: 32,
          }}
        >
          {currentQuestion.text}
        </Text>

        {currentQuestion.options_json.map((option, index) => {
          const isSelected = currentAnswer === option;

          return (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: isSelected ? "#0095AE20" : "#FFFFFF",
                borderWidth: 2,
                borderColor: isSelected ? "#0095AE" : "#E4E8EC",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: isSelected ? "#0095AE" : "#000000",
                }}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fixed Bottom Navigation */}
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
        {isLastQuestion ? (
          <View style={{ gap: 8 }}>
            {/* Primary button */}
            <TouchableOpacity
              style={{
                backgroundColor: canProceed ? "#0095AE" : "#C9D0DC",
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={handleSubmit}
              disabled={!canProceed || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  Add Photos
                </Text>
              )}
            </TouchableOpacity>

            {/* Alternative button for debugging */}
            <TouchableOpacity
              style={{
                backgroundColor: "#007A3B",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={handleSkipToResults}
              disabled={!canProceed || submitting}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Skip Photos & See AI Results
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E4E8EC",
                  paddingVertical: 16,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                {ChevronLeftIcon ? (
                  <ChevronLeftIcon size={20} color="#00454F" />
                ) : (
                  <Text
                    style={{ color: "#00454F", fontSize: 20, marginRight: 4 }}
                  >
                    {"<"}
                  </Text>
                )}
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: "#00454F",
                    marginLeft: 4,
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                flex: currentIndex === 0 ? 1 : 2,
                backgroundColor: canProceed ? "#0095AE" : "#C9D0DC",
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={handleNext}
              disabled={!canProceed || submitting}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: "#FFFFFF",
                  marginRight: 4,
                }}
              >
                Next
              </Text>
              {ChevronRightIcon && (
                <ChevronRightIcon size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
