import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../lib/AuthProvider";
import {
  getSavedPlaceIds,
  removeSavedPlace,
} from "../../../lib/savedPlacesStore";
import { getPlaceById } from "../../../lib/searchPlaces";

export default function SavedPlacesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getSavedPlaceIds(user?.id)
        .then((nextIds) => {
          if (active) setIds(nextIds);
        })
        .catch(() =>
          Alert.alert(
            "Saved places unavailable",
            "Your saved places could not be loaded.",
          ),
        );
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const remove = async (id: string) => {
    try {
      await removeSavedPlace(id, user?.id);
      setIds((current) => current.filter((savedId) => savedId !== id));
    } catch {
      Alert.alert("Could not remove place", "Please try again.");
    }
  };

  const savedPlaces = ids.flatMap((id) => {
    const place = getPlaceById(id);
    return place ? [place] : [];
  });

  return (
    <View className="flex-1 bg-[#F5F7FB]" style={{ paddingTop: insets.top }}>
      <Text className="text-ink text-2xl font-bold px-5 pt-4 pb-3">
        Saved Places
      </Text>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {savedPlaces.length ? (
          savedPlaces.map((place) => (
            <View
              key={place.id}
              className="bg-white rounded-2xl border border-border p-4 mb-3 flex-row items-center"
            >
              <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Ionicons name="bookmark" size={19} color="#187FF6" />
              </View>
              <View className="flex-1">
                <Text className="text-ink font-bold">{place.name}</Text>
                <Text className="text-ink-muted text-sm mt-1">
                  {place.category}
                </Text>
              </View>
              <Pressable
                onPress={() => void remove(place.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${place.name} from saved places`}
                className="w-11 h-11 items-center justify-center"
              >
                <Ionicons name="bookmark" size={20} color="#187FF6" />
              </Pressable>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center mt-4">
            <Ionicons name="bookmark-outline" size={32} color="#187FF6" />
            <Text className="text-ink font-semibold mt-3">
              No saved places yet
            </Text>
            <Text className="text-ink-muted text-sm text-center mt-1">
              Bookmark a place from its map details to find it here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}