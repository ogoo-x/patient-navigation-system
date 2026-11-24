import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../lib/AuthProvider";
import { formatDistance } from "../../../lib/eta";
import { getVisits, type CompletedVisit } from "../../../lib/visitStore";

export default function VisitHistoryScreen() {
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
            "Visit history unavailable",
            "Saved visits could not be loaded.",
          ),
        );
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  return (
    <View className="flex-1 bg-[#F5F7FB]" style={{ paddingTop: insets.top }}>
      <Text className="text-ink text-2xl font-bold px-5 pt-4 pb-3">
        Visit History
      </Text>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {visits.length ? (
          visits.map((visit) => (
            <View
              key={visit.id}
              className="bg-white rounded-2xl border border-border p-4 mb-3 flex-row items-center"
            >
              <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Ionicons
                  name={visit.mode === "walk" ? "walk" : "car"}
                  size={20}
                  color="#187FF6"
                />
              </View>
              <View className="flex-1">
                <Text className="text-ink font-bold">{visit.placeName}</Text>
                <Text className="text-ink-muted text-sm mt-1">
                  {new Date(visit.visitedAt).toLocaleString()}
                </Text>
                <Text className="text-primary text-sm mt-1">
                  {formatDistance(visit.distanceMeters)} · {visit.mode}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center mt-4">
            <Ionicons name="time-outline" size={32} color="#187FF6" />
            <Text className="text-ink font-semibold mt-3">
              No completed routes yet
            </Text>
            <Text className="text-ink-muted text-sm text-center mt-1">
              Your completed campus visits will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}