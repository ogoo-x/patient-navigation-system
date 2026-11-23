import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/AuthProvider";
import { supabase } from "../lib/supabase";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { destination, campus } = useLocalSearchParams<{
    destination?: string;
    campus?: string;
  }>();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const returnToMap = useCallback(
    () => router.replace({ pathname: "/(tabs)/map" }),
    [router],
  );

  useEffect(() => {
    if (submitState !== "success") return;
    const timer = setTimeout(returnToMap, 2200);
    return () => clearTimeout(timer);
  }, [returnToMap, submitState]);

  const submitFeedback = async () => {
    if (!rating || submitState === "submitting") return;
    setSubmitState("submitting");

    try {
      if (!supabase) throw new Error("Feedback is temporarily unavailable.");
      const { error } = await supabase.from("feedback").insert({
        rating,
        user_id: user?.id ?? null,
        comment: comment.trim() || null,
        destination: destination || null,
        campus: campus || null,
      });
      if (error) throw error;
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top, backgroundColor: "#FFFFFF" }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={returnToMap}
          accessibilityRole="button"
          accessibilityLabel="Skip feedback and return to the map without saving"
          className="self-start flex-row items-center rounded-full bg-primary px-6 py-3"
        >
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Skip</Text>
        </Pressable>

        <View className="w-full max-w-xl self-center flex-1 justify-center py-10">
          {submitState === "success" ? (
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="checkmark" size={34} color="#187FF6" />
              </View>
              <Text
                accessibilityRole="header"
                className="text-ink text-3xl font-bold text-center mt-5"
              >
                Thank you for your feedback
              </Text>
              <Text className="text-ink-muted text-center mt-3">
                Returning to the campus map…
              </Text>
              <Pressable
                onPress={returnToMap}
                accessibilityRole="button"
                className="rounded-full bg-primary px-6 py-3 mt-6"
              >
                <Text className="text-white font-bold">Return to map</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text
                accessibilityRole="header"
                className="text-ink text-3xl font-bold"
              >
                How was your trip?
              </Text>
              <Text className="text-ink-muted leading-6 mt-3">
                Your feedback helps us improve campus directions.
              </Text>

              <Text className="text-ink font-semibold mt-8">
                How helpful was this guide on your trip?
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Rate how helpful the guide was, from 1 to 5 stars"
                className="flex-row items-center mt-3"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${value} star${value === 1 ? "" : "s"}`}
                    accessibilityState={{ checked: rating === value }}
                    className="w-12 h-12 items-center justify-center mr-2"
                  >
                    <Ionicons
                      name={value <= (rating ?? 0) ? "star" : "star-outline"}
                      size={30}
                      color={value <= (rating ?? 0) ? "#EFC718" : "#6B7280"}
                    />
                  </Pressable>
                ))}
              </View>

              <Text className="text-ink font-semibold mt-7">
                What could be improved?{" "}
                <Text className="text-ink-muted font-normal">(optional)</Text>
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
                textAlignVertical="top"
                placeholder="Share anything that would make the guide better"
                placeholderTextColor="#6B7280"
                accessibilityLabel="Optional feedback comment, up to 500 characters"
                className="min-h-32 rounded-2xl border border-border bg-white px-4 py-3 text-ink mt-3"
              />
              <Text className="text-ink-muted text-xs text-right mt-1">
                {comment.length}/500
              </Text>

              {submitState === "error" ? (
                <Text
                  accessibilityRole="alert"
                  className="text-ink-muted leading-5 mt-4"
                >
                  We couldn’t save your feedback. You can try again or leave
                  without saving.
                </Text>
              ) : null}

              <Pressable
                onPress={() => void submitFeedback()}
                disabled={!rating || submitState === "submitting"}
                accessibilityRole="button"
                accessibilityLabel="Submit trip feedback"
                className={`rounded-full items-center justify-center flex-row py-4 mt-6 ${
                  rating && submitState !== "submitting"
                    ? "bg-primary"
                    : "bg-primary/40"
                }`}
              >
                {submitState === "submitting" ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Submit feedback</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
