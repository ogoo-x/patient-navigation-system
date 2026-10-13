// app/index.web.tsx
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const { height: SCREEN_H } = Dimensions.get("window");

const sections = [
  {
    key: "hero",
    title: "Never get lost on campus again",
    body: "Share your location and get clear walking directions around the NAUTH campus.",
    showCtas: true,
    final: false,
  },
  {
    key: "save",
    title: "Save places you need",
    body: "Pin clinics, wards, and entrances. Open them again whenever you come back.",
    showCtas: false,
    final: false,
  },
  {
    key: "guide",
    title: "Your campus navigation guide",
    body: "Maps, directions, and saved places in one place.",
    showCtas: true,
    final: true,
  },
];

export default function Landing() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.y / SCREEN_H);
    if (next !== index && next >= 0 && next < sections.length) {
      setIndex(next);
    }
  };

  const goToMap = () => router.push("/(tabs)/map");
  const goToLogin = () => router.push("/login");

  const progress = sections.length <= 1 ? 0 : index / (sections.length - 1);
  const isFinal = index === sections.length - 1;

  return (
    <View className="flex-1 bg-white">
      {/* Top bar */}
      <View className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 pb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-primary">Bubbles.</Text>
        <Pressable
          onPress={goToLogin}
          className="px-4 py-2 rounded-full border border-primary"
        >
          <Text className="text-primary font-semibold text-sm">Log in</Text>
        </Pressable>
      </View>

      {/* Progress rail: gray track, blue thumb, gold on last slide */}
      <View
        pointerEvents="none"
        className="absolute right-5 top-0 bottom-0 z-20 justify-center"
      >
        <View className="h-40 w-1 rounded-full bg-border overflow-hidden">
          <View
            className={`absolute left-0 w-1 h-12 rounded-full ${
              isFinal ? "bg-accent" : "bg-primary"
            }`}
            style={{
              top: `${progress * 100}%`,
              transform: [{ translateY: -24 }],
            }}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        disableIntervalMomentum
      >
        {sections.map((section) => (
          <View
            key={section.key}
            style={{ height: SCREEN_H }}
            className="w-full bg-white px-8 justify-center"
          >
            <View className="w-full max-w-3xl self-center pr-10">
              <Text className="text-4xl md:text-5xl font-bold text-ink leading-tight mb-4">
                {section.title}
              </Text>
              <Text className="text-base md:text-lg text-ink-muted leading-7 mb-8 max-w-xl">
                {section.body}
              </Text>

              <View className="w-full max-w-md aspect-[4/3] rounded-3xl bg-surface border border-border items-center justify-center mb-8">
                <Text className="text-ink-muted text-sm text-center">
                  Illustration placeholder
                </Text>
              </View>

              {section.showCtas && (
                <View className="flex-row flex-wrap gap-3">
                  <Pressable
                    onPress={goToMap}
                    className={`rounded-full px-6 py-4 ${
                      section.final ? "bg-ink" : "bg-primary"
                    }`}
                  >
                    <Text className="text-white font-bold text-base">
                      {section.final ? "Get started" : "Open map as guest"}
                    </Text>
                  </Pressable>

                  {!section.final && (
                    <Pressable
                      onPress={goToLogin}
                      className="rounded-full px-6 py-4 border border-primary"
                    >
                      <Text className="text-primary font-semibold text-base">
                        Log in / Sign up
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
