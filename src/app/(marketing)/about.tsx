import { Text, View } from "react-native";

export default function AboutPage() {
  return (
    <View className="w-full max-w-4xl self-center px-6 py-14">
      <Text className="text-primary text-sm font-bold uppercase tracking-wider">
        About Bubbles
      </Text>
      <Text className="text-ink text-4xl font-bold mt-3">
        A clearer way around campus
      </Text>
      <Text className="text-ink-muted text-lg leading-8 mt-5">
        Bubbles is a hospital campus wayfinding guide. Our mission is to make it
        easier for patients and visitors to find the care and services they
        need. The guide is growing campus by campus, and its directions depend
        on the map data available for each location.
      </Text>
    </View>
  );
}
