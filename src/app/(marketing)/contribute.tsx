import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const contributionOptions = [
  {
    icon: "bug-outline" as const,
    title: "Report an issue",
    description: "Tell us when a place or route is missing or incorrect.",
  },
  {
    icon: "business-outline" as const,
    title: "Suggest a campus",
    description: "Let us know which hospital campus would benefit next.",
  },
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Submit feedback",
    description: "Share what worked and what could be improved.",
  },
  {
    icon: "code-slash-outline" as const,
    title: "Contribute code",
    description: "Help improve the app and its campus navigation tools.",
  },
];

export default function ContributePage() {
  return (
    <View className="w-full max-w-4xl self-center px-6 py-14">
      <Text className="text-primary text-sm font-bold uppercase tracking-wider">
        How to contribute
      </Text>
      <Text className="text-ink text-4xl font-bold mt-3">
        Help make campus visits easier
      </Text>
      <Text className="text-ink-muted text-lg leading-8 mt-5">
        These contribution channels are being set up. For now, use the app
        feedback form for trip feedback; other contact links will be added when
        they are available.
      </Text>
      <View className="mt-8 gap-3">
        {contributionOptions.map((option) => (
          <View
            key={option.title}
            className="rounded-2xl border border-border bg-white p-5 flex-row items-start"
          >
            <Ionicons
              name={option.icon}
              size={22}
              color="#187FF6"
              style={{ marginRight: 14, marginTop: 1 }}
            />
            <View className="flex-1">
              <Text className="text-ink font-bold">{option.title}</Text>
              <Text className="text-ink-muted leading-6 mt-1">
                {option.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
