import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { campuses } from "../../data/marketing";

export default function CampusesPage() {
  return (
    <View className="w-full max-w-4xl self-center px-6 py-14">
      <Text className="text-primary text-sm font-bold uppercase tracking-wider">
        Campuses
      </Text>
      <Text className="text-ink text-4xl font-bold mt-3">
        Find a supported campus
      </Text>
      <Text className="text-ink-muted text-lg leading-8 mt-5">
        Bubbles is being introduced one campus at a time. This list reflects
        the locations currently available in the guide.
      </Text>
      <View className="mt-8 gap-3">
        {campuses.map((campus) => (
          <View
            key={campus.name}
            className="rounded-2xl border border-border bg-white p-5 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
              <Ionicons name="location" size={22} color="#187FF6" />
            </View>
            <View>
              <Text className="text-ink font-bold text-lg">{campus.name}</Text>
              <Text className="text-ink-muted mt-1">{campus.location}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
