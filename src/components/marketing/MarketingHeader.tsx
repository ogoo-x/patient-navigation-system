import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "../../hooks/use-reduced-motion";

export default function MarketingHeader({
  showBackHome = false,
}: {
  showBackHome?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const login = () =>
    router.push({ pathname: "/login", params: { next: "/(tabs)/map" } });

  return (
    <View
      style={{ paddingTop: insets.top + 16 }}
      className={`w-full flex-row items-center justify-between ${
        width >= 900 ? "px-10 pb-5" : "px-6 pb-4"
      }`}
    >
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel="Bubbles home">
          <Text className="text-primary text-2xl font-bold">Bubbles</Text>
        </Pressable>
      </Link>
      <View className="flex-row items-center gap-3">
        {showBackHome && (
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              className="rounded-full px-3 py-2 hover:opacity-75 active:opacity-75"
            >
              <Text className="text-primary font-semibold">Back to home</Text>
            </Pressable>
          </Link>
        )}
        <SignInButton onPress={login} reduceMotion={reduceMotion} />
      </View>
    </View>
  );
}

function SignInButton({
  onPress,
  reduceMotion,
}: {
  onPress: () => void;
  reduceMotion: boolean;
}) {
  const [active, setActive] = useState(false);
  const [edges] = useState(() =>
    Array.from({ length: 4 }, () => new Animated.Value(0)),
  );

  useEffect(() => {
    if (reduceMotion) {
      edges.forEach((edge) => edge.setValue(active ? 1 : 0));
      return;
    }

    Animated.parallel(
      edges.map((edge, index) =>
        Animated.timing(edge, {
          toValue: active ? 1 : 0,
          duration: 100,
          delay: (active ? index : 3 - index) * 50,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [active, edges, reduceMotion]);

  const edgeStyle = (progress: Animated.Value, axis: "x" | "y") => ({
    opacity: progress,
    transform: [axis === "x" ? { scaleX: progress } : { scaleY: progress }],
  });

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onPressIn={() => setActive(true)}
      onPressOut={() => setActive(false)}
      accessibilityRole="button"
      accessibilityLabel="Sign in"
      className="relative overflow-hidden rounded-full border border-primary bg-white px-5 py-2.5 shadow-sm"
    >
      <Text className="text-primary font-semibold">Sign in</Text>
      <Animated.View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 h-0.5 bg-accent"
        style={edgeStyle(edges[0], "x")}
      />
      <Animated.View
        pointerEvents="none"
        className="absolute right-0 top-0 bottom-0 w-0.5 bg-accent"
        style={edgeStyle(edges[1], "y")}
      />
      <Animated.View
        pointerEvents="none"
        className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent"
        style={edgeStyle(edges[2], "x")}
      />
      <Animated.View
        pointerEvents="none"
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"
        style={edgeStyle(edges[3], "y")}
      />
    </Pressable>
  );
}
