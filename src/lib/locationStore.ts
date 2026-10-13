// src/lib/locationStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bubbles_user_location";

export type StoredLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  savedAt: string;
};

export async function saveUserLocation(loc: StoredLocation) {
  await AsyncStorage.setItem(KEY, JSON.stringify(loc));
}

export async function getUserLocation(): Promise<StoredLocation | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLocation;
  } catch {
    return null;
  }
}

export async function clearUserLocation() {
  await AsyncStorage.removeItem(KEY);
}