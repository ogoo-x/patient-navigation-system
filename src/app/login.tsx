// app/login.tsx
import PrimaryButton from "@/components/primarybutton";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const continueAsGuest = () => {
    router.replace("/(tabs)/map");
  };

  const continueWithGoogle = async () => {
    // Day 13 will wire this to Supabase OAuth.
    // For now just continue into the app so the flow is testable.
    router.replace("/(tabs)/map");
  };

  return (
    <View
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
    >
      {/* Close / back (useful because login is a modal on mobile) */}
      <Pressable onPress={() => router.back()} className="self-end mb-6 p-2">
        <Text className="text-ink-muted text-base">Close</Text>
      </Pressable>

      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-ink text-center mb-2">
          Patient Nav
        </Text>
        <Text className="text-ink-muted text-center text-base mb-12 px-4 leading-6">
          The best way to find your way around the NAUTH Akamili campus.
        </Text>

        <View className="gap-3">
          <PrimaryButton
            label="Continue with Google"
            onPress={continueWithGoogle}
          />

          <PrimaryButton
            label="Continue as Guest"
            variant="outline"
            onPress={continueAsGuest}
          />
        </View>

        <Text className="text-ink-muted text-center text-sm mt-8 px-6 leading-5">
          Guests can use the map freely. Sign in later from Profile to save
          visit history and feedback.
        </Text>
      </View>
    </View>
  );
}
