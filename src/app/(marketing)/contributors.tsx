import { Text, View } from "react-native";
import { contributors } from "../../data/marketing";

export default function ContributorsPage() {
  return (
    <View className="w-full max-w-4xl self-center px-6 py-14">
      <Text className="text-primary text-sm font-bold uppercase tracking-wider">
        Contributors
      </Text>
      <Text className="text-ink text-4xl font-bold mt-3">
        Built with community support
      </Text>
      <Text className="text-ink-muted text-lg leading-8 mt-5">
        This contributor list is a placeholder and will be updated as
        contributors opt in to being listed.
      </Text>
      <View className="mt-8 gap-3">
        {contributors.map((contributor) => (
          <View
            key={contributor.name}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <Text className="text-ink font-bold">{contributor.name}</Text>
            <Text className="text-ink-muted mt-1">{contributor.role}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
