import { Ionicons } from "@expo/vector-icons";
import { Slot, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useAuth } from "../../lib/AuthProvider";

export default function WebTabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path: "/(tabs)/map" | "/(tabs)/profile") => {
    setMenuOpen(false);
    router.replace({ pathname: path });
  };

  const onSignOut = async () => {
    setMenuOpen(false);
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Could not sign out",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <View className="flex-1">
      <Slot />
      {menuOpen ? (
        <Pressable
          onPress={() => setMenuOpen(false)}
          className="absolute inset-0"
          style={{ zIndex: 20 }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="absolute right-5 top-20 w-56 rounded-2xl bg-primary p-2"
            style={{ zIndex: 22, elevation: 10 }}
          >
            <MenuItem
              icon="map-outline"
              label="Map"
              onPress={() => goTo("/(tabs)/map")}
            />
            <MenuItem
              icon="person-outline"
              label="Profile"
              onPress={() => goTo("/(tabs)/profile")}
            />
            {user ? (
              <MenuItem
                icon="log-out-outline"
                label="Sign out"
                onPress={() => void onSignOut()}
              />
            ) : (
              <MenuItem
                icon="log-in-outline"
                label="Sign in"
                onPress={() => {
                  setMenuOpen(false);
                  router.push({
                    pathname: "/login",
                    params: { next: pathname },
                  });
                }}
              />
            )}
          </Pressable>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => setMenuOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={menuOpen ? "Close menu" : "Open menu"}
        className="absolute right-5 top-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ zIndex: 21, elevation: 7 }}
      >
        <Ionicons
          name={menuOpen ? "close" : "menu"}
          size={27}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl px-3 py-3"
    >
      <Ionicons name={icon} size={20} color="white" />
      <Text className="text-white font-semibold ml-3">{label}</Text>
    </Pressable>
  );
}
