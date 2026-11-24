import AsyncStorage from "@react-native-async-storage/async-storage";

export type CompletedVisit = {
  id: string;
  placeId: string;
  placeName: string;
  visitedAt: string;
  mode: "walk" | "car";
  distanceMeters: number;
};

const keyFor = (userId?: string) =>
  `bubbles_visits_${userId ?? "guest"}`;

export async function getVisits(userId?: string): Promise<CompletedVisit[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved visit history has an invalid format.");
  }
  return parsed as CompletedVisit[];
}

export async function addVisit(
  visit: CompletedVisit,
  userId?: string,
): Promise<void> {
  const visits = await getVisits(userId);
  await AsyncStorage.setItem(
    keyFor(userId),
    JSON.stringify([visit, ...visits]),
  );
}
