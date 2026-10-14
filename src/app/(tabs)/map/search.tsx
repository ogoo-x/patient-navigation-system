// app/(tabs)/map/search.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Place } from "../../../data/places";
import { setPendingPick } from "../../../lib/mapRouteStore";
import { getParentPlace, getPlaceCoords, searchPlaces } from "../../../lib/searchPlaces";

function highlightName(name: string, query: string) {
  if (!query.trim()) {
    return <Text className="text-ink font-bold text-base">{name}</Text>;
  }
  const q = query.trim();
  const lower = name.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) {
    return <Text className="text-ink font-bold text-base">{name}</Text>;
  }
  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + q.length);
  const after = name.slice(idx + q.length);
  return (
    <Text className="text-ink font-bold text-base">
      {before}
      <Text className="text-primary">{match}</Text>
      {after}
    </Text>
  );
}

function categoryIcon(
  category: Place["category"],
): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case "emergency":
      return "medkit";
    case "clinic":
      return "medical";
    case "diagnostics":
      return "flask";
    case "mother-child":
      return "people";
    case "gate":
      return "enter";
    default:
      return "business";
  }
}

export default function MapSearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { for: searchFor } = useLocalSearchParams<{
    for?: string | string[];
  }>();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchPlaces(query), [query]);
  const isEmptyQuery = query.trim().length === 0;

  const title =
    searchFor === "origin" ? "Your location" : "Select a destination";

  const onSelect = (place: Place) => {
    const roleRaw = Array.isArray(searchFor) ? searchFor[0] : searchFor;
    const role = roleRaw === "origin" ? "origin" : "destination";

    const coords = getPlaceCoords(place);
    if (!coords) return;

    setPendingPick({
      role,
      placeId: place.id,
      name: place.name,
      lat: coords.lat,
      lng: coords.lng,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Search bar */}
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-surface border border-border rounded-full px-4 h-12">
          <Ionicons name="search" size={20} color="#187FF6" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search clinic, bay, or building..."
            placeholderTextColor="#6B7280"
            className="flex-1 ml-2 text-ink font-sans text-base"
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} className="px-2 py-3">
          <Text className="text-ink-muted font-semibold">Cancel</Text>
        </Pressable>
      </View>

      <Text className="px-5 pb-2 text-ink-muted text-xs font-semibold uppercase tracking-wider">
        {title}
      </Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ask us — disabled */}
        <View className="mx-4 mb-4 p-4 rounded-2xl bg-surface border border-border flex-row items-center opacity-50">
          <View className="w-10 h-10 rounded-full bg-border/60 items-center justify-center mr-3">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#6B7280"
            />
          </View>
          <View className="flex-1">
            <Text className="text-ink-muted font-semibold">
              Not sure? Ask us
            </Text>
            <Text className="text-ink-muted font-sans text-sm">
              Coming soon — describe where you need to go
            </Text>
          </View>
          <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
        </View>

        {/* Section label */}
        <View className="px-5 mb-2 flex-row items-center justify-between">
          <Text className="text-ink-muted text-xs font-semibold uppercase tracking-wider">
            {isEmptyQuery
              ? "Places popularly visited"
              : `Results (${results.length})`}
          </Text>
        </View>

        {results.length === 0 ? (
          <View className="px-5 py-10 items-center">
            <Text className="text-ink-muted font-sans text-center">
              No places match “{query}”
            </Text>
          </View>
        ) : (
          results.map((place) => {
            const parent = getParentPlace(place);
            const isChild = Boolean(parent);

            return (
              <Pressable
                key={place.id}
                onPress={() => onSelect(place)}
                className={`mb-2 p-4 rounded-2xl bg-white border border-border flex-row items-start active:bg-surface ${
                  isChild ? "ml-8 mr-4" : "mx-4"
                }`}
              >
                {isChild ? (
                  <Text className="text-primary text-lg mr-1 mt-0.5">↳</Text>
                ) : null}

                <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons
                    name={categoryIcon(place.category)}
                    size={22}
                    color="#187FF6"
                  />
                </View>

                <View className="flex-1 min-w-0">
                  <View className="flex-row flex-wrap font-sans items-center gap-2">
                    {highlightName(place.name, query)}
                    {place.badge ? (
                      <View className="px-2 py-0.5 rounded-full bg-surface">
                        <Text className="text-ink-muted font-sans text-xs">
                          {place.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {parent ? (
                    <Text
                      className="text-primary font-semibold text-sm mt-0.5"
                      numberOfLines={1}
                    >
                      In {parent.name}
                    </Text>
                  ) : null}
                </View>

                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
