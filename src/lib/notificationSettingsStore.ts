import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bubbles_notification_settings";

export type NotificationSettings = {
  routeReminders: boolean;
  visitUpdates: boolean;
};

const defaults: NotificationSettings = {
  routeReminders: true,
  visitUpdates: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaults;
  return { ...defaults, ...(JSON.parse(raw) as Partial<NotificationSettings>) };
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
