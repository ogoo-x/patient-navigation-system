import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bubbles_primary_clinic";

export function getPrimaryClinic(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export function savePrimaryClinic(placeId: string): Promise<void> {
  return AsyncStorage.setItem(KEY, placeId);
}
