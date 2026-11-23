// app/_layout.tsx
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Platform } from "react-native";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import "../global.css";
import { AuthProvider } from "../lib/AuthProvider";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(marketing)" />
        <Stack.Screen name="feedback" />
        <Stack.Screen
          name="login"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
          }}
        />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
