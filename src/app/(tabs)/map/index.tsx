// app/(tabs)/map/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getUserLocation,
  saveUserLocation,
  type StoredLocation,
} from "../../../lib/locationStore";

type Phase = "loading" | "need-location" | "ready";

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    selectedPlaceId?: string;
    selectedPlaceName?: string;
    searchFor?: string;
  }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const selectedDestination =
    params.selectedPlaceName && params.searchFor !== "origin"
      ? params.selectedPlaceName
      : null;

  useEffect(() => {
    (async () => {
      const saved = await getUserLocation();
      if (saved) {
        setLocation(saved);
        setPhase("ready");
      } else {
        setPhase("need-location");
      }
    })();
  }, []);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "Bubbles needs your location to place you on the campus map. You can enable it in Settings.",
        );
        setLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const stored: StoredLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? undefined,
        savedAt: new Date().toISOString(),
      };

      await saveUserLocation(stored);
      setLocation(stored);
      setSheetOpen(false);
      setPhase("ready");
    } catch {
      Alert.alert(
        "Could not get location",
        "Check that location is on, then try again.",
      );
    } finally {
      setLocating(false);
    }
  }, []);

  const openDestinationSearch = () => {
    router.push({
      pathname: "/(tabs)/map/search",
      params: { for: "destination" },
    });
  };

  // ── Loading ────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#187FF6" />
      </View>
    );
  }

  // ── Empty state: need location ─────────────────────────────────
  if (phase === "need-location") {
    return (
      <View
        className="flex-1 bg-white px-8 items-center justify-center"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-6">
          <Ionicons name="location" size={36} color="#187FF6" />
        </View>

        <Text className="text-ink text-xl font-bold text-center mb-2">
          Add your address to start exploring
        </Text>
        <Text className="text-ink-muted text-center text-base mb-8 px-4">
          We use your location only to place you on the NAUTH campus map.
        </Text>

        <Pressable
          onPress={() => setSheetOpen(true)}
          className="bg-surface border border-border rounded-full px-6 py-3"
        >
          <Text className="text-ink font-semibold">Choose your location</Text>
        </Pressable>

        <LocationSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          locating={locating}
          onUseCurrent={useCurrentLocation}
        />
      </View>
    );
  }

  // ── Ready: location saved, pick destination ────────────────────
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Destination search field */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-ink font-bold text-lg mb-3 text-center">
          Select an address
        </Text>
        <Pressable
          onPress={openDestinationSearch}
          className="flex-row items-center bg-surface border border-border rounded-full px-4 h-12"
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <Text
            className={`flex-1 ml-2 text-base ${
              selectedDestination ? "text-ink" : "text-ink-muted"
            }`}
            numberOfLines={1}
          >
            {selectedDestination || "Search clinic, bay, or building..."}
          </Text>
        </Pressable>
      </View>

      {/* Map placeholder — OpenStreetMap later */}
      <View className="flex-1 mx-4 mb-4 rounded-3xl bg-surface border border-border overflow-hidden items-center justify-center">
        <Ionicons name="map-outline" size={48} color="#9CA3AF" />
        <Text className="text-ink-muted mt-3 text-sm text-center px-6">
          Campus map goes here
        </Text>
        {location && (
          <Text className="text-ink-muted text-xs mt-2">
            You: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </Text>
        )}
        {selectedDestination && (
          <Text className="text-primary text-sm font-semibold mt-2 px-4 text-center">
            Going to: {selectedDestination}
          </Text>
        )}
      </View>

      {/* Bottom CTA */}
      <View className="px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          className={`rounded-full py-4 items-center ${
            selectedDestination ? "bg-primary" : "bg-primary/40"
          }`}
          disabled={!selectedDestination}
          onPress={() => {
            // Next: draw route to selected place
          }}
        >
          <Text className="text-white font-bold text-base">
            Select location
          </Text>
        </Pressable>
      </View>

      {/* Re-open location sheet */}
      <Pressable
        onPress={() => setSheetOpen(true)}
        className="absolute right-4"
        style={{ top: insets.top + 56 }}
      >
        <View className="bg-white border border-border rounded-full p-2">
          <Ionicons name="locate" size={20} color="#187FF6" />
        </View>
      </Pressable>

      <LocationSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        locating={locating}
        onUseCurrent={useCurrentLocation}
      />
    </View>
  );
}

function LocationSheet({
  open,
  onClose,
  locating,
  onUseCurrent,
}: {
  open: boolean;
  onClose: () => void;
  locating: boolean;
  onUseCurrent: () => void;
}) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/30 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl px-5 pt-4 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-ink text-lg font-bold">Your location</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <View className="flex-row items-center bg-surface rounded-full px-4 h-12 mb-4 border border-border">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              placeholder="Enter an address"
              placeholderTextColor="#6B7280"
              className="flex-1 ml-2 text-ink text-base"
              editable={!locating}
            />
          </View>

          <Pressable
            onPress={onUseCurrent}
            disabled={locating}
            className="flex-row items-center py-3"
          >
            {locating ? (
              <ActivityIndicator color="#187FF6" />
            ) : (
              <Ionicons name="locate" size={22} color="#187FF6" />
            )}
            <Text className="text-primary font-semibold text-base ml-3">
              {locating
                ? "Getting your location…"
                : "Use your current location"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
