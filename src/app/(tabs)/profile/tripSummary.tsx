import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../lib/AuthProvider";
import { formatDistance } from "../../../lib/eta";
import { getVisits, type CompletedVisit } from "../../../lib/visitStore";

export default function TripSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [visits, setVisits] = useState<CompletedVisit[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getVisits(user?.id)
        .then((nextVisits) => {
          if (active) setVisits(nextVisits);
        })
        .catch(() =>
          Alert.alert(
            "Trip summaries unavailable",
            "Saved visits could not be loaded.",
          ),
        );
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const totals = useMemo(() => {
    const distance = visits.reduce((sum, visit) => sum + visit.distanceMeters, 0);
    const walkCount = visits.filter((visit) => visit.mode === "walk").length;
    return { distance, walkCount, carCount: visits.length - walkCount };
  }, [visits]);

  return (
    <View className="flex-1 bg-[#F5F7FB]" style={{ paddingTop: insets.top }}>
      <Text className="text-ink text-2xl font-bold px-5 pt-4 pb-3">
        Trip Summaries
      </Text>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="bg-white rounded-2xl border border-border p-5 mb-4">
          <Text className="text-ink-muted text-sm">Completed visits</Text>
          <Text className="text-ink text-3xl font-bold mt-1">
            {visits.length}
          </Text>
        </View>
        <View className="bg-white rounded-2xl border border-border p-5 mb-4">
          <Text className="text-ink-muted text-sm">Total route distance</Text>
          <Text className="text-ink text-3xl font-bold mt-1">
            {formatDistance(totals.distance)}
          </Text>
        </View>
        <View className="bg-white rounded-2xl border border-border p-5">
          <View className="flex-row items-center mb-3">
            <Ionicons name="walk" size={20} color="#187FF6" />
            <Text className="text-ink ml-3 flex-1">Walking routes</Text>
            <Text className="text-ink font-bold">{totals.walkCount}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="car" size={20} color="#187FF6" />
            <Text className="text-ink ml-3 flex-1">Driving routes</Text>
            <Text className="text-ink font-bold">{totals.carCount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}