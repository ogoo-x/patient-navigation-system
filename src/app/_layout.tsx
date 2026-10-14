// app/_layout.tsx
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "../global.css";

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    const T = Text as typeof Text & { defaultProps?: { style?: object } };
    T.defaultProps = T.defaultProps || {};
    T.defaultProps.style = {
      ...(T.defaultProps.style || {}),
      fontFamily: "Montserrat_400Regular",
    };
  }, [loaded]);

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#187FF6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" options={{ presentation: "modal" }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
