import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CampusMapWebView, {
  type CampusMapHandle,
} from "../../../components/CampusMapWebView";
import SheetHandle from "../../../components/SheetHandle";
import { places, type Place } from "../../../data/places";
import { useAuth } from "../../../lib/AuthProvider";
import { isInsideCampus, NAUTH_MAIN_GATE } from "../../../lib/campusBounds";
import {
  distanceBetween,
  estimateTravelMinutes,
  formatDistance,
  remainingRouteDistanceMeters,
  routeDistanceMeters,
  type TravelMode,
} from "../../../lib/eta";
import {
  buildDirectionSteps,
  directionStepAtProgress,
  type DirectionStep,
} from "../../../lib/directions";
import {
  saveUserLocation,
  type StoredLocation,
} from "../../../lib/locationStore";
import { consumePendingPick } from "../../../lib/mapRouteStore";
import { nearestNodeId } from "../../../lib/pathfinding";
import {
  getPrimaryClinic,
  savePrimaryClinic,
} from "../../../lib/primaryClinicStore";
import { getPlaceImage } from "../../../lib/placeImages";
import { routePointsBetween } from "../../../lib/routePoints";
import {
  getPlaceById,
  getPlaceCoords,
  searchPlaces,
} from "../../../lib/searchPlaces";
import {
  getSavedPlaceIds,
  toggleSavedPlace,
} from "../../../lib/savedPlacesStore";
import { addVisit } from "../../../lib/visitStore";
import { campuses } from "../../../data/marketing";

type RouteEnd = {
  kind: "gps" | "place";
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type Feedback = "positive" | "negative";

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 900;
  const desktopPanelWidth = Math.min(390, windowWidth * 0.36);
  const [desktopPanelProgress] = useState(
    () => new Animated.Value(0),
  );
  const desktopPanelMotion = {
    opacity: desktopPanelProgress,
    transform: [
      {
        translateX: desktopPanelProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-desktopPanelWidth, 0],
        }),
      },
    ],
  };
  const { user, profile, updateProfile } = useAuth();
  const mapRef = useRef<CampusMapHandle>(null);
  const originRef = useRef<RouteEnd | null>(null);
  const arrivalHandledRef = useRef(false);
  const arrivalRecordedRef = useRef(false);

  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<RouteEnd | null>(null);
  const [destination, setDestination] = useState<RouteEnd | null>(null);
  const [mode, setMode] = useState<TravelMode>("walk");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchRole, setSearchRole] = useState<
    "origin" | "destination" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [guidance, setGuidance] = useState("Follow the highlighted route");
  const [directionsPreview, setDirectionsPreview] = useState(false);
  const [activeDirectionIndex, setActiveDirectionIndex] = useState(0);
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<
    number | null
  >(null);
  const [sheetPlaceId, setSheetPlaceId] = useState<string | null>(null);
  const [primaryClinicId, setPrimaryClinicId] = useState<string | null>(null);
  const [savedPlaceId, setSavedPlaceId] = useState<string | null>(null);
  const [routeSummaryCollapsed, setRouteSummaryCollapsed] = useState(false);

  useEffect(() => {
    if (!isDesktopWeb) return;
    desktopPanelProgress.setValue(0);
    const animation = Animated.timing(desktopPanelProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [
    arrived,
    desktopPanelProgress,
    destination?.placeId,
    isDesktopWeb,
    searchRole,
    sheetPlaceId,
  ]);

  const sheetPlace = sheetPlaceId ? getPlaceById(sheetPlaceId) : null;
  const placeIsSaved = Boolean(sheetPlaceId && savedPlaceId === sheetPlaceId);
  const placeImage = sheetPlace
    ? (getPlaceImage(sheetPlace.id) ??
      (sheetPlace.imageUri ? { uri: sheetPlace.imageUri } : undefined))
    : undefined;
  const routePoints = useMemo<[number, number][]>(() => {
    if (!origin || !destination) return [];
    const fromId = nearestNodeId(origin.lat, origin.lng);
    const toId = nearestNodeId(destination.lat, destination.lng);
    const graphPoints = routePointsBetween(fromId, toId);
    return graphPoints.length >= 2
      ? [
          [origin.lat, origin.lng],
          ...graphPoints,
          [destination.lat, destination.lng],
        ]
      : [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ];
  }, [destination, origin]);
  const offCampus = Boolean(
    location && !isInsideCampus(location.lat, location.lng),
  );
  const distanceMeters = useMemo(
    () => routeDistanceMeters(routePoints),
    [routePoints],
  );
  const directionSteps = useMemo(
    () =>
      destination
        ? buildDirectionSteps(routePoints, destination.label)
        : [],
    [destination, routePoints],
  );
  const travelMinutes = estimateTravelMinutes(distanceMeters, mode);
  const suggestedPlaces = useMemo(
    () =>
      places
        .filter(
          (place) =>
            place.popular &&
            place.id !== destination?.placeId &&
            place.id !== origin?.placeId &&
            getPlaceCoords(place) !== null,
        )
        .slice(0, 3),
    [destination?.placeId, origin?.placeId],
  );
  const searchResults = useMemo(
    () => searchPlaces(searchQuery).filter((place) => getPlaceCoords(place)),
    [searchQuery],
  );

  const updateOrigin = useCallback((next: RouteEnd | null) => {
    originRef.current = next;
    setOrigin(next);
    setNavigating(false);
    setArrived(false);
    setFeedback(null);
    setGuidance("Follow the highlighted route");
  }, []);

  const updateDestination = useCallback((next: RouteEnd | null) => {
    setDestination(next);
    setDirectionsPreview(false);
    setActiveDirectionIndex(0);
    setSelectedDirectionIndex(null);
    if (next) setRouteSummaryCollapsed(false);
    setNavigating(false);
    setArrived(false);
    setFeedback(null);
    setGuidance("Follow the highlighted route");
  }, []);

  const refreshCurrentLocation = useCallback(
    async (selectAsOrigin = true, showErrors = true) => {
      setLocating(true);
      setLocationError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location access is off. Tap to try again.");
          if (showErrors) {
            Alert.alert(
              "Location needed",
              "Allow location access to show your position on the campus map.",
            );
          }
          return null;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const current: StoredLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          savedAt: new Date().toISOString(),
        };
        setLocationError(null);
        setLocation(current);
        const shouldUpdateOrigin =
          selectAsOrigin ||
          !originRef.current ||
          originRef.current.kind === "gps";
        mapRef.current?.setLocation(
          current.lat,
          current.lng,
          shouldUpdateOrigin,
        );
        if (shouldUpdateOrigin) {
          updateOrigin({
            kind: "gps",
            label: "My location",
            lat: current.lat,
            lng: current.lng,
          });
        }
        try {
          await saveUserLocation(current);
        } catch {
          setLocationError(
            "Your live location is active but could not be saved.",
          );
          Alert.alert(
            "Location not saved",
            "Your current position is available, but could not be saved for next time.",
          );
        }
        return current;
      } catch {
        setLocationError(
          "Could not get your location. Check location settings.",
        );
        if (showErrors) {
          Alert.alert(
            "Could not get location",
            "Check that location is enabled, then try again.",
          );
        }
        return null;
      } finally {
        setLocating(false);
      }
    },
    [updateOrigin],
  );

  useFocusEffect(
    useCallback(() => {
      const pick = consumePendingPick();
      if (pick?.kind === "place") {
        const end: RouteEnd = {
          kind: "place",
          label: pick.name,
          lat: pick.lat,
          lng: pick.lng,
          placeId: pick.placeId,
        };
        if (pick.role === "origin") updateOrigin(end);
        else updateDestination(end);
      }
      const selectGps = pick?.kind === "gps" || (!pick && !originRef.current);
      void refreshCurrentLocation(selectGps, selectGps);
    }, [refreshCurrentLocation, updateDestination, updateOrigin]),
  );

  useEffect(() => {
    let active = true;
    if (profile?.primary_clinic_id) {
      void Promise.resolve().then(() => {
        if (active) setPrimaryClinicId(profile.primary_clinic_id);
      });
    } else {
      void getPrimaryClinic()
        .then((id) => {
          if (active) setPrimaryClinicId(id);
        })
        .catch(() =>
          Alert.alert(
            "Could not load clinic",
            "Your saved primary clinic is unavailable.",
          ),
        );
    }
    return () => {
      active = false;
    };
  }, [profile?.primary_clinic_id]);

  useEffect(() => {
    if (!origin) {
      mapRef.current?.clearRoute();
      return;
    }

    mapRef.current?.setOrigin(origin.lat, origin.lng, origin.label);
    if (!destination) {
      mapRef.current?.clearRoute();
      return;
    }
    mapRef.current?.setDestination(
      destination.lat,
      destination.lng,
      destination.label,
    );
    mapRef.current?.drawRoute(routePoints);
  }, [destination, origin, routePoints]);

  useEffect(() => {
    if (selectedDirectionIndex === null || !directionSteps.length) {
      mapRef.current?.clearRouteHighlight();
      return;
    }

    const step = directionSteps[selectedDirectionIndex];
    if (step) {
      mapRef.current?.highlightRouteSegment(
        routePoints,
        step.startIndex,
        step.endIndex,
      );
    }
  }, [directionSteps, routePoints, selectedDirectionIndex]);

  useEffect(() => {
    if (!navigating || !destination || routePoints.length < 2) return;

    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location needed",
            "Allow location access to start live guidance.",
          );
          setNavigating(false);
          return;
        }
        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 3,
            timeInterval: 3000,
          },
          (position) => {
            if (arrivalHandledRef.current) return;
            const current = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation({
              ...current,
              accuracy: position.coords.accuracy ?? undefined,
              savedAt: new Date().toISOString(),
            });
            mapRef.current?.setLocation(current.lat, current.lng, false);
            if (
              distanceBetween(current, {
                lat: destination.lat,
                lng: destination.lng,
              }) <= 30
            ) {
                arrivalHandledRef.current = true;
                setArrived(true);
                setNavigating(false);
              return;
            }

            const remainingMeters = remainingRouteDistanceMeters(
              current,
              routePoints,
            );
            const progressMeters = Math.max(0, distanceMeters - remainingMeters);
            const stepIndex = directionStepAtProgress(
              directionSteps,
              progressMeters,
            );
            setActiveDirectionIndex(stepIndex);
            setGuidance(
              remainingMeters < 80
                ? "You are approaching your destination"
                : directionSteps[stepIndex]?.instruction ??
                    "Continue on the highlighted route",
            );
          },
        );
        if (active) subscription = nextSubscription;
        else nextSubscription.remove();
      } catch {
        Alert.alert(
          "Navigation unavailable",
          "Live location guidance could not be started.",
        );
        setNavigating(false);
      }
    };

    void startWatching();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [destination, directionSteps, distanceMeters, navigating, routePoints]);

  useEffect(() => {
    if (!arrived || !destination || arrivalRecordedRef.current) return;
    arrivalRecordedRef.current = true;
    void addVisit(
      {
        id: `${Date.now()}-${destination.placeId ?? "destination"}`,
        placeId: destination.placeId ?? "",
        placeName: destination.label,
        visitedAt: new Date().toISOString(),
        mode,
        distanceMeters,
      },
      user?.id,
    ).catch(() =>
      Alert.alert(
        "Visit not saved",
        "You arrived, but this visit could not be added to your history.",
      ),
    );
  }, [arrived, destination, distanceMeters, mode, user?.id]);

  useEffect(() => {
    if (!sheetPlaceId) return;
    let active = true;
    void getSavedPlaceIds(user?.id)
      .then((ids) => {
        if (active) setSavedPlaceId(ids.includes(sheetPlaceId) ? sheetPlaceId : null);
      })
      .catch(() =>
        Alert.alert(
          "Saved places unavailable",
          "Could not check whether this place is saved.",
        ),
      );
    return () => {
      active = false;
    };
  }, [sheetPlaceId, user?.id]);

  const closePlaceDetails = useCallback(() => {
    setSheetPlaceId(null);
    mapRef.current?.clearPlaceSelection();
  }, []);

  const openSearch = (role: "origin" | "destination") => {
    closePlaceDetails();
    if (isDesktopWeb) {
      setSearchQuery("");
      setSearchRole(role);
      return;
    }
    router.push({
      pathname: "/(tabs)/map/search",
      params: { for: role },
    });
  };

  const onMapReady = useCallback(() => {
    const pins = places
      .filter((place) => place.showOnMap)
      .flatMap((place) => {
        const coords = getPlaceCoords(place);
        return coords
          ? [
              {
                lat: coords.lat,
                lng: coords.lng,
                name: place.name,
                category: place.category,
                id: place.id,
              },
            ]
          : [];
      });
    mapRef.current?.setPlaces(pins);
    if (location) {
      mapRef.current?.setLocation(
        location.lat,
        location.lng,
        origin?.kind !== "place",
      );
    }
    if (origin) mapRef.current?.setOrigin(origin.lat, origin.lng, origin.label);
    if (destination) {
      mapRef.current?.setDestination(
        destination.lat,
        destination.lng,
        destination.label,
      );
    }
    if (routePoints.length >= 2) mapRef.current?.drawRoute(routePoints);
  }, [destination, location, origin, routePoints]);

  const openGoogleMaps = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${NAUTH_MAIN_GATE.lat},${NAUTH_MAIN_GATE.lng}&travelmode=driving`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Could not open Maps",
        "Try opening Google Maps on your device.",
      );
    }
  };

  const setPrimaryClinic = async (place: Place) => {
    try {
      await savePrimaryClinic(place.id);
      setPrimaryClinicId(place.id);
      if (user) {
        try {
          await updateProfile({ primary_clinic_id: place.id });
        } catch {
          Alert.alert(
            "Saved on this device",
            "The primary clinic could not be synced to your account.",
          );
          return;
        }
      }
      Alert.alert(
        "Primary clinic saved",
        `${place.name} is now your primary clinic.`,
      );
    } catch {
      Alert.alert("Could not save clinic", "Please try again.");
    }
  };

  const toggleCurrentPlaceSaved = async (place: Place) => {
    if (!user) {
      router.push({
        pathname: "/login",
        params: { next: "/(tabs)/map" },
      });
      return;
    }
    try {
      const saved = await toggleSavedPlace(place.id, user.id);
      setSavedPlaceId(saved ? place.id : null);
    } catch {
      Alert.alert("Could not save place", "Please try again.");
    }
  };

  const startNavigation = () => {
    arrivalHandledRef.current = false;
    arrivalRecordedRef.current = false;
    setFeedback(null);
    setArrived(false);
    setGuidance("Finding your position…");
    setActiveDirectionIndex(0);
    setSelectedDirectionIndex(0);
    setDirectionsPreview(true);
    setNavigating(true);
  };

  const endNavigation = () => {
    const feedbackParams = destination
      ? {
          destination: destination.label,
          campus: campuses[0]?.name ?? null,
        }
      : undefined;
    resetNavigation();
    if (feedbackParams) {
      router.push({ pathname: "/feedback", params: feedbackParams });
    } else {
      router.push({ pathname: "/feedback" });
    }
  };

  const resetNavigation = () => {
    if (navigating && destination && !arrivalRecordedRef.current) {
      arrivalRecordedRef.current = true;
      void addVisit(
        {
          id: `${Date.now()}-${destination.placeId ?? "destination"}`,
          placeId: destination.placeId ?? "",
          placeName: destination.label,
          visitedAt: new Date().toISOString(),
          mode,
          distanceMeters,
        },
        user?.id,
      ).catch(() =>
        Alert.alert(
          "Trip not saved",
          "Navigation ended, but this trip could not be added to your history.",
        ),
      );
    }
    setNavigating(false);
    setArrived(false);
    setFeedback(null);
    setDirectionsPreview(false);
    setSelectedDirectionIndex(null);
  };

  return (
    <View
      className="flex-1 bg-white"
      style={[
        { position: "relative" },
        Platform.OS === "web" ? { minHeight: windowHeight } : undefined,
      ]}
    >
      <CampusMapWebView
        ref={mapRef}
        initialCenter={{ lat: 5.999, lng: 6.881 }}
        onMapReady={onMapReady}
        onPlaceTap={(id) => setSheetPlaceId(id)}
        onPlaceDismiss={() => setSheetPlaceId(null)}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />

      {!isDesktopWeb || !searchRole ? (
        <View
          className={`absolute left-4 flex-row items-start gap-2 ${
            isDesktopWeb ? "" : "right-4"
          }`}
          style={[
            { top: insets.top + 8 },
            isDesktopWeb ? { width: desktopPanelWidth } : undefined,
          ]}
        >
          <View
            className="flex-1 bg-white rounded-2xl overflow-hidden border border-[#202124]"
            style={{
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 4,
            }}
          >
            <Pressable
              onPress={() => openSearch("origin")}
              className="flex-row items-center px-4 py-2 border-b border-border"
            >
              <View className="w-2.5 h-2.5 rounded-full bg-primary mr-3" />
              <View className="flex-1">
                <Text className="text-ink-muted text-xs">From</Text>
                <Text
                  className="text-ink text-sm font-semibold"
                  numberOfLines={1}
                >
                  {origin?.label ?? "My location"}
                </Text>
              </View>
              <Ionicons name="search" size={20} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={() => openSearch("destination")}
              className="flex-row items-center px-4 py-2"
            >
              <View className="w-2.5 h-2.5 rounded-full mr-3 bg-[#EFC718]" />
              <View className="flex-1">
                <Text className="text-ink-muted text-xs">To</Text>
                <Text
                  className={`text-sm font-semibold ${
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
          <Pressable
            onPress={() => {
              if (destination) updateDestination(null);
              closePlaceDetails();
            }}
            disabled={!destination && !sheetPlaceId}
            accessibilityRole="button"
            accessibilityLabel="Clear destination or close place details"
            className={`w-12 h-12 rounded-full bg-white border border-[#202124] items-center justify-center ${
              !destination && !sheetPlaceId ? "opacity-50" : ""
            }`}
            style={{ elevation: 4 }}
          >
            <Ionicons name="close" size={22} color="#111827" />
          </Pressable>
        </View>
      ) : null}

      {isDesktopWeb && searchRole ? (
        <Animated.View
          className="absolute left-4 top-4 bottom-4 rounded-3xl bg-white overflow-hidden"
          style={[
            {
              width: desktopPanelWidth,
              maxHeight: "82%",
              elevation: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
            },
            {
              position: "absolute",
              left: 16,
              top: 16,
              bottom: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              zIndex: 30,
            },
            desktopPanelMotion,
          ]}
        >
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
            <Text className="text-ink text-lg font-bold">
              {searchRole === "origin"
                ? "Choose a starting point"
                : "Choose a destination"}
            </Text>
            <Pressable
              onPress={() => setSearchRole(null)}
              accessibilityRole="button"
              accessibilityLabel="Close place search"
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#111827" />
            </Pressable>
          </View>
          <View className="mx-4 mb-3 h-12 flex-row items-center rounded-xl bg-surface px-3">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search clinics, wards, buildings"
              placeholderTextColor="#6B7280"
              autoFocus
              className="ml-2 flex-1 text-ink"
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {searchRole === "origin" ? (
              <Pressable
                onPress={() => {
                  setSearchRole(null);
                  void refreshCurrentLocation(true, true);
                }}
                className="mx-3 mb-2 flex-row items-center rounded-xl px-3 py-3"
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="locate" size={19} color="#187FF6" />
                </View>
                <View>
                  <Text className="text-ink font-semibold">My location</Text>
                  <Text className="text-ink-muted text-xs mt-0.5">
                    Use your current GPS position
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {searchResults.map((place) => (
              <Pressable
                key={place.id}
                onPress={() => {
                  const coords = getPlaceCoords(place);
                  if (!coords) return;
                  const next: RouteEnd = {
                    kind: "place",
                    label: place.name,
                    lat: coords.lat,
                    lng: coords.lng,
                    placeId: place.id,
                  };
                  if (searchRole === "origin") updateOrigin(next);
                  else updateDestination(next);
                  setSearchRole(null);
                }}
                className="mx-3 flex-row items-center rounded-xl px-3 py-3"
              >
                <Ionicons
                  name={
                    place.category === "emergency"
                      ? "medkit"
                      : place.category === "diagnostics"
                        ? "flask"
                        : place.category === "gate"
                          ? "enter"
                          : "medical"
                  }
                  size={19}
                  color="#187FF6"
                />
                <Text className="flex-1 text-ink font-semibold ml-3">
                  {place.name}
                </Text>
                <Ionicons name="chevron-forward" size={17} color="#9CA3AF" />
              </Pressable>
            ))}
            {!searchResults.length ? (
              <Text className="px-5 py-8 text-center text-ink-muted">
                No matching places
              </Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      ) : null}

      <View
        className="absolute right-4 gap-3"
        style={{
          top: insets.top + (offCampus ? 210 : locationError ? 184 : 142),
        }}
      >
        <MapControl
          icon={locating ? "hourglass-outline" : "locate"}
          accessibilityLabel="Locate me"
          onPress={() => void refreshCurrentLocation(true, true)}
        />
        <MapControl
          icon="compass-outline"
          accessibilityLabel="Reset map north"
          onPress={() => mapRef.current?.resetNorth()}
        />
      </View>

      {offCampus && !searchRole ? (
        <Pressable
          onPress={() => void openGoogleMaps()}
          className={`absolute left-4 ${
            isDesktopWeb ? "" : "right-4"
          } bg-white rounded-2xl px-4 py-3 flex-row items-center`}
          style={[
            { top: insets.top + 148, elevation: 5 },
            isDesktopWeb ? { width: desktopPanelWidth } : undefined,
          ]}
        >
          <Ionicons name="navigate" size={20} color="#187FF6" />
          <Text className="flex-1 text-ink font-semibold ml-2">
            You’re outside NAUTH. Get directions to the hospital.
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#187FF6" />
        </Pressable>
      ) : null}
      {locationError && !offCampus && !searchRole ? (
        <Pressable
          onPress={() => void refreshCurrentLocation(true, true)}
          className={`absolute left-4 ${
            isDesktopWeb ? "" : "right-4"
          } bg-white rounded-xl px-4 py-2.5 flex-row items-center`}
          style={[
            { top: insets.top + 128, elevation: 5 },
            isDesktopWeb ? { width: desktopPanelWidth } : undefined,
          ]}
        >
          <Ionicons name="warning-outline" size={18} color="#B45309" />
          <Text className="text-ink font-semibold ml-2">{locationError}</Text>
        </Pressable>
      ) : null}

      {origin &&
      destination &&
      !arrived &&
      !sheetPlace &&
      !searchRole &&
      !routeSummaryCollapsed ? (
        <Animated.View
          pointerEvents="auto"
          className={`absolute left-4 bg-white rounded-3xl px-5 pt-4 ${
            isDesktopWeb ? "" : "right-4 bottom-0 rounded-t-3xl"
          }`}
          style={[
            {
              position: "absolute",
              left: 16,
              right: isDesktopWeb ? undefined : 16,
              bottom: isDesktopWeb ? undefined : 0,
              paddingBottom: isDesktopWeb ? 16 : insets.bottom + 16,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: isDesktopWeb ? undefined : 24,
              borderTopRightRadius: isDesktopWeb ? undefined : 24,
              zIndex: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 12,
            },
            isDesktopWeb
              ? {
                  left: 16,
                  top: insets.top + 132,
                  width: desktopPanelWidth,
                  maxHeight: "72%",
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  paddingBottom: 16,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  zIndex: 12,
                }
              : undefined,
            isDesktopWeb ? desktopPanelMotion : undefined,
          ]}
        >
          <SheetHandle onDismiss={() => setRouteSummaryCollapsed(true)} />
          {directionsPreview ? (
            <>
              <View className="flex-row items-center mb-3">
                <View className="flex-1">
                  <Text className="text-ink text-lg font-bold">
                    {navigating ? "Live directions" : "Preview directions"}
                  </Text>
                  <Text className="text-ink-muted text-xs mt-1">
                    {formatDistance(distanceMeters)} · {travelMinutes} min ·{" "}
                    {destination.label}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setDirectionsPreview(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Show route overview"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color="#6B7280" />
                </Pressable>
              </View>
              <ScrollView
                className="shrink"
                style={{ maxHeight: isDesktopWeb ? 390 : 300 }}
                showsVerticalScrollIndicator={false}
              >
                {directionSteps.map((step, index) => (
                  <DirectionStepRow
                    key={`${step.maneuver}-${index}`}
                    step={step}
                    active={index === activeDirectionIndex}
                    onPress={() => {
                      setActiveDirectionIndex(index);
                      setSelectedDirectionIndex(index);
                    }}
                  />
                ))}
              </ScrollView>
              <View className="flex-row items-center justify-between mt-2">
                <Pressable
                  onPress={() => {
                    const index = Math.max(0, activeDirectionIndex - 1);
                    setActiveDirectionIndex(index);
                    setSelectedDirectionIndex(index);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Previous direction step"
                  disabled={activeDirectionIndex <= 0}
                  className="rounded-full px-3 py-2"
                >
                  <Text
                    className={`font-semibold ${
                      activeDirectionIndex <= 0
                        ? "text-ink-muted"
                        : "text-primary"
                    }`}
                  >
                    Previous
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const index = Math.min(
                      directionSteps.length - 1,
                      activeDirectionIndex + 1,
                    );
                    setActiveDirectionIndex(index);
                    setSelectedDirectionIndex(index);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Next direction step"
                  disabled={activeDirectionIndex >= directionSteps.length - 1}
                  className="rounded-full px-3 py-2"
                >
                  <Text
                    className={`font-semibold ${
                      activeDirectionIndex >= directionSteps.length - 1
                        ? "text-ink-muted"
                        : "text-primary"
                    }`}
                  >
                    Next
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedDirectionIndex(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Show full route"
                  className="rounded-full px-3 py-2"
                >
                  <Text className="text-primary font-semibold">
                    Full route
                  </Text>
                </Pressable>
              </View>
              {!navigating ? (
                <Pressable
                  onPress={startNavigation}
                  className="bg-primary rounded-full py-3.5 items-center flex-row justify-center mt-3"
                >
                  <Ionicons name="navigate" size={18} color="white" />
                  <Text className="text-white font-bold ml-2">
                    Start navigation
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={endNavigation} className="mt-3 items-center">
                  <Text className="text-primary font-bold">End navigation</Text>
                </Pressable>
              )}
            </>
          ) : navigating ? (
            <View className="flex-row items-center mb-3">
              <Ionicons name="navigate" size={20} color="#187FF6" />
              <Text className="flex-1 text-ink font-semibold ml-2">
                {guidance}
              </Text>
              <Pressable
                onPress={endNavigation}
                accessibilityRole="button"
                accessibilityLabel="End navigation"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={24} color="#6B7280" />
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-ink text-lg font-bold">
                    {mode === "walk" ? "Walking distance" : "Driving distance"}
                  </Text>
                  <Text className="text-ink text-xs mt-1" numberOfLines={1}>
                    Approx. {travelMinutes} min from{" "}
                    {origin.kind === "gps"
                      ? "your current location"
                      : origin.label}
                  </Text>
                  <Text className="text-ink-muted text-xs mt-1">
                    {formatDistance(distanceMeters)} total
                  </Text>
                </View>
                <View className="w-16 h-16 bg-accent border border-black rounded-xl items-center justify-center">
                  <Text className="text-ink text-2xl font-bold">
                    {travelMinutes}
                  </Text>
                  <Text className="text-ink text-xs">mins</Text>
                </View>
              </View>
              <View className="h-px bg-border my-3" />
              <View className="flex-row items-center">
                <ModeButton
                  selected={mode === "walk"}
                  icon="walk"
                  onPress={() => setMode("walk")}
                />
                <ModeButton
                  selected={mode === "car"}
                  icon="car"
                  onPress={() => setMode("car")}
                />
                <View className="flex-1" />
                <Text className="text-ink-muted text-xs mr-1">
                  Suggested locations
                </Text>
                <Pressable
                  onPress={() => setShowSuggestions((value) => !value)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showSuggestions
                      ? "Hide suggested locations"
                      : "Show suggested locations"
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name={showSuggestions ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
              {showSuggestions ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-2 mb-1"
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {suggestedPlaces.map((place) => (
                    <Pressable
                      key={place.id}
                      onPress={() => {
                        const coords = getPlaceCoords(place);
                        if (!coords) return;
                        updateDestination({
                          kind: "place",
                          label: place.name,
                          lat: coords.lat,
                          lng: coords.lng,
                          placeId: place.id,
                        });
                      }}
                      className="flex-row items-center rounded-xl border border-border px-3 py-2"
                    >
                      <Ionicons
                        name={
                          place.category === "gate"
                            ? "enter"
                            : place.category === "emergency"
                              ? "medkit"
                              : place.category === "diagnostics"
                                ? "flask"
                                : "medical"
                        }
                        size={8}
                        color="#187FF6"
                      />
                      <Text
                        className="text-ink text-xs font-semibold ml-2 max-w-32"
                        numberOfLines={1}
                      >
                        {place.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <Pressable
                onPress={() => {
                  setActiveDirectionIndex(0);
                  setDirectionsPreview(true);
                }}
                accessibilityRole="button"
                className="border border-primary rounded-full py-3 items-center mt-3"
              >
                <Text className="text-primary font-bold">Preview directions</Text>
              </Pressable>
            </>
          )}
          {!navigating && !directionsPreview ? (
            <Pressable
              onPress={startNavigation}
              className="bg-primary rounded-full py-3.5 items-center flex-row justify-center"
            >
              <Ionicons name="navigate" size={18} color="white" />
              <Text className="text-white font-bold ml-2">
                Start navigation
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
      {origin &&
      destination &&
      !arrived &&
      !sheetPlace &&
      !searchRole &&
      routeSummaryCollapsed ? (
        <Pressable
          onPress={() => setRouteSummaryCollapsed(false)}
          accessibilityRole="button"
          accessibilityLabel="Show route summary"
          className={`absolute bg-white rounded-full px-4 py-3 flex-row items-center ${
            isDesktopWeb ? "right-20" : "right-4"
          }`}
          style={[
            {
              position: "absolute",
              right: isDesktopWeb ? 68 : 16,
              elevation: 8,
              backgroundColor: "#FFFFFF",
              zIndex: 12,
            },
            isDesktopWeb
              ? { bottom: 56 }
              : { bottom: insets.bottom + 12 },
            isDesktopWeb
              ? { left: 16, backgroundColor: "#FFFFFF", zIndex: 12 }
              : undefined,
          ]}
        >
          <Ionicons
            name={mode === "walk" ? "walk" : "car"}
            size={18}
            color="#187FF6"
          />
          <Text className="text-ink font-bold ml-2">
            {mode === "walk" ? "Walking" : "Driving"} ·{" "}
            {formatDistance(distanceMeters)} · {travelMinutes} min
          </Text>
        </Pressable>
      ) : null}

      {arrived && destination && !sheetPlace && !searchRole ? (
        <Animated.View
          pointerEvents="auto"
          className={`absolute left-4 bg-white px-5 pt-5 ${
            isDesktopWeb
              ? "rounded-3xl"
              : "right-4 bottom-0 rounded-t-3xl"
          }`}
          style={[
            {
              position: "absolute",
              left: 16,
              right: isDesktopWeb ? undefined : 16,
              bottom: isDesktopWeb ? undefined : 0,
              paddingBottom: isDesktopWeb ? 16 : insets.bottom + 16,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: isDesktopWeb ? undefined : 24,
              borderTopRightRadius: isDesktopWeb ? undefined : 24,
              zIndex: 12,
              elevation: 12,
            },
            isDesktopWeb
              ? {
                  left: 16,
                  top: insets.top + 132,
                  width: desktopPanelWidth,
                  maxHeight: "72%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  zIndex: 12,
                }
              : undefined,
            isDesktopWeb ? desktopPanelMotion : undefined,
          ]}
        >
          <SheetHandle onDismiss={() => setArrived(false)} />
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle" size={26} color="#16A34A" />
            <Text className="text-ink text-xl font-bold ml-2">
              You’ve arrived
            </Text>
          </View>
          <Text className="text-ink-muted mb-4">{destination.label}</Text>
          {feedback ? (
            <Text className="text-ink font-semibold text-center mb-3">
              Thanks for your feedback.
            </Text>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-ink-muted">Was the route helpful?</Text>
              <View className="flex-row gap-3">
                <FeedbackButton
                  selected={feedback === "positive"}
                  icon="thumbs-up"
                  label="Route was helpful"
                  onPress={() => setFeedback("positive")}
                />
                <FeedbackButton
                  selected={feedback === "negative"}
                  icon="thumbs-down"
                  label="Route was not helpful"
                  onPress={() => setFeedback("negative")}
                />
              </View>
            </View>
          )}
          <Pressable onPress={endNavigation} className="mt-4 items-center">
            <Text className="text-primary font-bold">Done</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {sheetPlace && !searchRole ? (
        <Animated.View
          pointerEvents="auto"
          className={`absolute bg-white px-5 pt-3 ${
            isDesktopWeb
              ? "left-4 rounded-3xl"
              : "left-0 right-0 bottom-0 rounded-t-3xl"
          }`}
          style={[
            {
              position: "absolute",
              left: isDesktopWeb ? 16 : 0,
              right: isDesktopWeb ? undefined : 0,
              bottom: isDesktopWeb ? 20 : 0,
              paddingBottom: isDesktopWeb ? 16 : insets.bottom + 16,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: isDesktopWeb ? undefined : 24,
              borderTopRightRadius: isDesktopWeb ? undefined : 24,
              zIndex: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 12,
              maxHeight: isDesktopWeb ? "72%" : "58%",
            },
            isDesktopWeb
              ? {
                  position: "absolute",
                  left: 16,
                  bottom: 20,
                  width: desktopPanelWidth,
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  zIndex: 30,
                  maxHeight: "72%",
                  overflow: "hidden",
                }
              : undefined,
            isDesktopWeb ? desktopPanelMotion : undefined,
          ]}
        >
          <SheetHandle onDismiss={closePlaceDetails} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {placeImage ? (
              <Image
                source={placeImage}
                className="rounded-2xl mb-3"
                style={{
                  width: "100%",
                  height: 112,
                  maxWidth: "100%",
                  flexShrink: 0,
                  alignSelf: "center",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="rounded-2xl mb-3 bg-primary/10 items-center justify-center"
                style={{ width: "100%", height: 96, flexShrink: 0 }}
              >
                <Ionicons name="medical" size={32} color="#187FF6" />
                <Text className="text-ink-muted text-xs mt-1">
                  Place photo coming soon
                </Text>
              </View>
            )}
            <Text className="text-ink text-xl font-bold mb-1">
              {sheetPlace.name}
            </Text>
            {sheetPlace.badge ? (
              <View className="self-start px-2 py-1 rounded-full bg-primary/10 mb-3">
                <Text className="text-primary text-xs font-semibold">
                  {sheetPlace.badge}
                </Text>
              </View>
            ) : null}
            {sheetPlace.summary ? (
              <Text className="text-ink-muted text-base mb-3">
                {sheetPlace.summary}
              </Text>
            ) : null}
            {sheetPlace.services?.length ? (
              <View className="mb-3">
                <Text className="text-ink font-semibold mb-1">Services</Text>
                {sheetPlace.services.map((service) => (
                  <Text key={service} className="text-ink-muted text-sm mb-0.5">
                    • {service}
                  </Text>
                ))}
              </View>
            ) : null}
            {sheetPlace.category === "clinic" ? (
              <Pressable
                onPress={() => void setPrimaryClinic(sheetPlace)}
                className="border border-primary rounded-full py-3 items-center mt-1"
              >
                <Text className="text-primary font-bold">
                  {primaryClinicId === sheetPlace.id
                    ? "Primary clinic"
                    : "Set as primary clinic"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void toggleCurrentPlaceSaved(sheetPlace)}
              className="border border-border rounded-full py-3 items-center mt-3 flex-row justify-center"
            >
              <Ionicons
                name={placeIsSaved ? "bookmark" : "bookmark-outline"}
                size={18}
                color="#187FF6"
              />
              <Text className="text-primary font-bold ml-2">
                {placeIsSaved ? "Saved place" : "Save place"}
              </Text>
            </Pressable>
            <Pressable
              className="bg-primary rounded-full py-3 items-center mt-3"
              onPress={() => {
                const coords = getPlaceCoords(sheetPlace);
                if (!coords) return;
                updateDestination({
                  kind: "place",
                  label: sheetPlace.name,
                  lat: coords.lat,
                  lng: coords.lng,
                  placeId: sheetPlace.id,
                });
                closePlaceDetails();
                setActiveDirectionIndex(0);
                setSelectedDirectionIndex(0);
                setDirectionsPreview(true);
              }}
            >
              <Text className="text-white font-bold">Directions</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

function MapControl({
  icon,
  accessibilityLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-12 h-12 bg-white rounded-full items-center justify-center"
      style={{ elevation: 5 }}
    >
      <Ionicons name={icon} size={22} color="#187FF6" />
    </Pressable>
  );
}

function DirectionStepRow({
  step,
  active,
  onPress,
}: {
  step: DirectionStep;
  active: boolean;
  onPress: () => void;
}) {
  const icon: keyof typeof Ionicons.glyphMap =
    step.maneuver === "left"
      ? "arrow-back"
      : step.maneuver === "right"
        ? "arrow-forward"
        : step.maneuver === "arrive"
          ? "flag"
          : "arrow-up";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center py-3 px-2 border-b border-border rounded-xl ${
        active ? "bg-primary/10" : ""
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#111827" />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            active ? "text-primary" : "text-ink-muted"
          }`}
        >
          {step.instruction}
        </Text>
        {step.subtitle ? (
          <Text className="text-ink-muted text-xs mt-1">{step.subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ModeButton({
  selected,
  icon,
  onPress,
}: {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        icon === "walk" ? "Walking directions" : "Driving directions"
      }
      className={`w-11 h-11 flex-row items-center justify-center rounded-xl mr-2 ${
        selected ? "bg-primary" : "bg-surface"
      }`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? "#FFFFFF" : "#4B5563"}
      />
    </Pressable>
  );
}

function FeedbackButton({
  selected,
  icon,
  label,
  onPress,
}: {
  selected: boolean;
  icon: "thumbs-up" | "thumbs-down";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`w-11 h-11 rounded-full items-center justify-center ${
        selected ? "bg-primary/10" : "bg-surface"
      }`}
    >
      <Ionicons name={icon} size={20} color="#187FF6" />
    </Pressable>
  );
}
