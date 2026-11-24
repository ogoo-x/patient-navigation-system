// app/(tabs)/map/_layout.tsx
import { Stack } from "expo-router";

export default function MapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="search"
        options={{ animation: "slide_from_bottom", presentation: "card" }}
      />
    </Stack>
  );
}
