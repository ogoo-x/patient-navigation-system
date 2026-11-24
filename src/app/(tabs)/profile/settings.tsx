import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "../../../lib/notificationSettingsStore";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    void getNotificationSettings()
      .then(setSettings)
      .catch(() =>
        Alert.alert("Settings unavailable", "Notification preferences could not be loaded."),
      );
  }, []);

  const toggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      await saveNotificationSettings(next);
    } catch {
      setSettings(previous);
      Alert.alert("Could not save setting", "Please try again.");
    }
  };

  return (
    <View
      className="flex-1 bg-[#F5F7FB] px-5"
      style={{ paddingTop: insets.top + 16 }}
    >
      <Text className="text-ink text-2xl font-bold mb-4">
        Settings & Notifications
      </Text>
      <View className="bg-white rounded-2xl border border-border overflow-hidden">
        {(
          [
            ["routeReminders", "Route reminders"],
            ["visitUpdates", "Visit updates"],
          ] as const
        ).map(([key, title], index) => (
          <Pressable
            key={key}
            onPress={() => void toggle(key)}
            className={`flex-row items-center p-4 ${
              index === 0 ? "border-b border-border" : ""
            }`}
          >
            <View className="flex-1">
              <Text className="text-ink font-semibold">{title}</Text>
              <Text className="text-ink-muted text-sm mt-1">
                Saved preference; push delivery is not enabled yet.
              </Text>
            </View>
            <View
              className={`w-12 h-7 rounded-full justify-center px-1 ${
                settings?.[key] ? "bg-primary items-end" : "bg-border items-start"
              }`}
            >
              <View className="w-5 h-5 rounded-full bg-white" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}