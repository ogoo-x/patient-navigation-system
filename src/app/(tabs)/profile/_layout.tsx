import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="visitHistory" />
      <Stack.Screen name="tripSummary" />
      <Stack.Screen name="savedPlaces" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
