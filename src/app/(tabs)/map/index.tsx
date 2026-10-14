// app/(tabs)/map/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CampusMapWebView, {
  type CampusMapHandle,
} from "../../../components/CampusMapWebView";
import { places } from "../../../data/places";
import {
  getUserLocation,
  saveUserLocation,
  type StoredLocation,
} from "../../../lib/locationStore";
import { consumePendingPick } from "../../../lib/mapRouteStore";
import { getPlaceById, getPlaceCoords } from "../../../lib/searchPlaces";

type Phase = "loading" | "need-location" | "ready";

type RouteEnd = {
  kind: "gps" | "place";
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
};

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<CampusMapHandle>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const [origin, setOrigin] = useState<RouteEnd | null>(null);
  const [destination, setDestination] = useState<RouteEnd | null>(null);

  const [sheetPlaceId, setSheetPlaceId] = useState<string | null>(null);
  const sheetPlace = sheetPlaceId ? getPlaceById(sheetPlaceId) : null;

  // Load saved GPS once. Do not overwrite From if user already chose a place.
  useEffect(() => {
    (async () => {
      const saved = await getUserLocation();
      if (saved) {
        setLocation(saved);
        setPhase("ready");
        setOrigin(
          (prev) =>
            prev ?? {
              kind: "gps",
              label: "My location",
              lat: saved.lat,
              lng: saved.lng,
            },
        );
      } else {
        setPhase("need-location");
      }
    })();
  }, []);

  // When returning from search, apply From or To without remounting the map
  useFocusEffect(
    useCallback(() => {
      const pick = consumePendingPick();
      if (!pick) return;

      const end: RouteEnd = {
        kind: "place",
        label: pick.name,
        lat: pick.lat,
        lng: pick.lng,
        placeId: pick.placeId,
      };

      if (pick.role === "origin") {
        setOrigin(end);
      } else {
        setDestination(end);
      }
    }, []),
  );

  // Auto-draw route when both ends are set
  useEffect(() => {
    if (!origin || !destination) return;

    mapRef.current?.setDestination?.(
      destination.lat,
      destination.lng,
      destination.label,
    );
    mapRef.current?.drawRoute?.([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ]);
  }, [origin, destination]);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "Bubbles needs your location to place you on the campus map.",
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
      setOrigin({
        kind: "gps",
        label: "My location",
        lat: stored.lat,
        lng: stored.lng,
      });
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

  const openSearch = (role: "origin" | "destination") => {
    router.push({
      pathname: "/(tabs)/map/search",
      params: { for: role },
    });
  };

  const resetOriginToGps = () => {
    if (!location) return;
    setOrigin({
      kind: "gps",
      label: "My location",
      lat: location.lat,
      lng: location.lng,
    });
  };

  const onMapReady = () => {
    if (location) {
      mapRef.current?.setLocation?.(location.lat, location.lng);
    }

    const pins = places
      .filter((p) => p.showOnMap)
      .map((p) => {
        const c = getPlaceCoords(p);
        if (!c) return null;
        return {
          lat: c.lat,
          lng: c.lng,
          name: p.name,
          category: p.category,
          id: p.id,
        };
      })
      .filter(Boolean) as {
      lat: number;
      lng: number;
      name: string;
      category: string;
      id: string;
    }[];

    mapRef.current?.setPlaces?.(pins);

    if (origin && destination) {
      mapRef.current?.setDestination?.(
        destination.lat,
        destination.lng,
        destination.label,
      );
      mapRef.current?.drawRoute?.([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#187FF6" />
      </View>
    );
  }

  // ── Need location once ────────────────────────────────────────
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

  // ── Full-screen map + floating From / To ──────────────────────
  return (
    <View className="flex-1 bg-white">
      <CampusMapWebView
        ref={mapRef}
        initialCenter={
          location
            ? { lat: location.lat, lng: location.lng }
            : { lat: 5.999, lng: 6.881 }
        }
        onMapReady={onMapReady}
        onPlaceTap={(id) => setSheetPlaceId(id)}
      />

      <View className="absolute left-4 right-4" style={{ top: insets.top + 8 }}>
        <View
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {/* From */}
          <Pressable
            onPress={() => openSearch("origin")}
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            <View className="w-2.5 h-2.5 rounded-full bg-primary mr-3" />
            <View className="flex-1">
              <Text className="text-ink-muted text-xs">From</Text>
              <Text
                className="text-ink text-base font-semibold"
                numberOfLines={1}
              >
                {origin?.label ?? "My location"}
              </Text>
            </View>
            {origin?.kind === "place" && location ? (
              <Pressable onPress={resetOriginToGps} hitSlop={8}>
                <Ionicons name="locate" size={20} color="#187FF6" />
              </Pressable>
            ) : null}
          </Pressable>

          {/* To */}
          <Pressable
            onPress={() => openSearch("destination")}
            className="flex-row items-center px-4 py-3"
          >
            <View
              className="w-2.5 h-2.5 rounded-full mr-3"
              style={{ backgroundColor: "#EFC718" }}
            />
            <View className="flex-1">
              <Text className="text-ink-muted text-xs">To</Text>
              <Text
                className={`text-base font-semibold ${
                  destination ? "text-ink" : "text-ink-muted"
                }`}
                numberOfLines={1}
              >
                {destination?.label ?? "Search clinics, wards, labs..."}
              </Text>
            </View>
            <Ionicons name="search" size={20} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <LocationSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        locating={locating}
        onUseCurrent={useCurrentLocation}
      />
      <Modal
        visible={!!sheetPlace}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetPlaceId(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setSheetPlaceId(null)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pt-3 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 rounded-full bg-border self-center mb-4" />

            <Text className="text-ink text-xl font-bold mb-1">
              {sheetPlace?.name}
            </Text>

            {sheetPlace?.badge ? (
              <View className="self-start px-2 py-1 rounded-full bg-primary/10 mb-3">
                <Text className="text-primary text-xs font-semibold">
                  {sheetPlace.badge}
                </Text>
              </View>
            ) : null}

            {sheetPlace?.summary ? (
              <Text className="text-ink-muted text-base mb-3">
                {sheetPlace.summary}
              </Text>
            ) : null}

            {sheetPlace?.services && sheetPlace.services.length > 0 ? (
              <View className="mb-3">
                <Text className="text-ink font-semibold mb-1">Services</Text>
                {sheetPlace.services.map((s) => (
                  <Text key={s} className="text-ink-muted text-sm mb-0.5">
                    • {s}
                  </Text>
                ))}
              </View>
            ) : null}

            {sheetPlace?.hours ? (
              <Text className="text-ink-muted text-sm mb-2">
                Hours: {sheetPlace.hours}
              </Text>
            ) : null}

            <Pressable
              className="bg-primary rounded-full py-3 items-center mt-2"
              onPress={() => {
                if (!sheetPlace) return;
                const c = getPlaceCoords(sheetPlace);
                if (!c) return;
                setDestination({
                  kind: "place",
                  label: sheetPlace.name,
                  lat: c.lat,
                  lng: c.lng,
                  placeId: sheetPlace.id,
                });
                setSheetPlaceId(null);
              }}
            >
              <Text className="text-white font-bold">Directions</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
