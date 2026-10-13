// app/(tabs)/_layout.web.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { Pressable, Text, View } from "react-native";

function TabItem({
  label,
  outline,
  filled,
  active,
}: {
  label: string;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
  active: boolean;
}) {
  return (
    <Pressable className="flex-row items-center gap-2 px-4 py-2 rounded-full">
      <Ionicons
        name={active ? filled : outline}
        size={20}
        color={active ? "#187FF6" : "#6B7280"}
      />
      <Text
        className={`text-sm font-semibold ${
          active ? "text-primary" : "text-ink-muted"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function WebTabsLayout() {
  const pathname = usePathname();

  const mapActive = pathname.includes("/map");
  const profileActive = pathname.includes("/profile");

  return (
    <Tabs>
      <TabList className="flex-row items-center justify-center gap-6 py-3 border-b border-border bg-white">
        <TabTrigger name="map" href="/map" asChild>
          <View>
            <TabItem
              label="Map"
              outline="map-outline"
              filled="map"
              active={mapActive}
            />
          </View>
        </TabTrigger>

        <TabTrigger name="profile" href="/profile" asChild>
          <View>
            <TabItem
              label="Profile"
              outline="person-outline"
              filled="person"
              active={profileActive}
            />
          </View>
        </TabTrigger>
      </TabList>

      <TabSlot />
    </Tabs>
  );
}
