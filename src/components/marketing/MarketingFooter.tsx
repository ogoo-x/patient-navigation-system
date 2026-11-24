import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { footerLinks } from "../../data/marketing";

export default function MarketingFooter() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 760;

  return (
    <View className="w-full bg-primary px-6 py-10">
      <View
        className={`w-full max-w-5xl self-center ${
          isDesktop ? "flex-row justify-between" : "gap-8"
        }`}
      >
        <Text className="text-white text-2xl font-bold">Bubbles</Text>
        <View className={isDesktop ? "flex-row gap-14" : "gap-8"}>
          <View>
            <Text className="text-white font-bold mb-3">Quick links</Text>
            {footerLinks.map((item) => (
              <Link key={item.label} href={item.href} asChild>
                <Pressable className="py-1 hover:opacity-75 active:opacity-75">
                  <Text className="text-white">{item.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <View>
            <Text className="text-white font-bold mb-3">Connect</Text>
            <View className="flex-row gap-4">
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityLabel="LinkedIn, coming soon"
                accessibilityState={{ disabled: true }}
                className="hover:opacity-75 active:opacity-75"
              >
                <Ionicons name="logo-linkedin" size={24} color="white" />
              </Pressable>
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityLabel="X (Twitter), coming soon"
                accessibilityState={{ disabled: true }}
                className="hover:opacity-75 active:opacity-75"
              >
                <Ionicons name="logo-twitter" size={24} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <Text className="text-white/75 text-sm text-center mt-8">
        © Bubbles campus guide
      </Text>
    </View>
  );
}
