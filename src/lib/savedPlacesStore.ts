import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (userId?: string) =>
  `bubbles_saved_places_${userId ?? "guest"}`;

export async function getSavedPlaceIds(userId?: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
    throw new Error("Saved places have an invalid format.");
  }
  return parsed;
}

export async function toggleSavedPlace(
  placeId: string,
  userId?: string,
): Promise<boolean> {
  const ids = await getSavedPlaceIds(userId);
  const saved = ids.includes(placeId);
  const next = saved ? ids.filter((id) => id !== placeId) : [placeId, ...ids];
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  return !saved;
}

export async function removeSavedPlace(
  placeId: string,
  userId?: string,
): Promise<void> {
  const ids = await getSavedPlaceIds(userId);
  await AsyncStorage.setItem(
    keyFor(userId),
    JSON.stringify(ids.filter((id) => id !== placeId)),
  );
}
