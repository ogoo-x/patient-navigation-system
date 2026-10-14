// app/onboarding.tsx
import { Ionicons } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "lost",
    bg: "bg-primary",
    titleColor: "text-white",
    title: "Never get lost again",
    body: "Share your location and get clear walking directions around the NAUTH campus.",
    isFinal: false,
  },
  {
    key: "save",
    bg: "bg-primary",
    titleColor: "text-white",
    title: "Save places you need",
    body: "Pin clinics, wards, and entrances. Open them again whenever you come back.",
    isFinal: false,
  },
  {
    key: "guide",
    bg: "bg-accent",
    titleColor: "text-ink",
    title: "Your campus navigation guide",
    body: "Maps, directions, and saved places in one calm place.",
    isFinal: true,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const finish = () => {
    router.replace({ pathname: "/(tabs)/map" });
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      finish();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const current = slides[index];

  return (
    <View className={`flex-1 ${current.bg}`}>
      {/* Skip: only on first two slides */}
      {!current.isFinal && (
        <Pressable
          onPress={finish}
          style={{ paddingTop: insets.top + 12 }}
          className="absolute right-5 z-10"
        >
          <Text className="text-white text-base font-medium opacity-90">
            Skip
          </Text>
        </Pressable>
      )}

      {/* Title lives on the background, not inside the white card */}
      <View style={{ paddingTop: insets.top + 56 }} className="px-8 mb-6">
        <Text
          className={`text-3xl font-bold leading-tight ${current.titleColor}`}
        >
          {current.title}
        </Text>
      </View>

      {/* Swipeable area: white card content changes per slide */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        className="flex-1"
      >
        {slides.map((slide) => (
          <View key={slide.key} style={{ width }} className="px-6">
            <View className="flex-1 bg-white rounded-3xl px-6 pt-8 pb-8 justify-between">
              {/* Illustration placeholder: swap for real art later */}
              <View className="flex-1 items-center justify-center mb-6">
                <View className="w-full aspect-square max-w-[240px] rounded-2xl bg-surface items-center justify-center border border-border">
                  <Text className="text-ink-muted text-sm text-center px-4">
                    Illustration placeholder
                  </Text>
                </View>
              </View>

              <Text className="text-ink text-base font-sans leading-6 text-center">
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={{ paddingBottom: insets.bottom + 24 }} className="px-8 pt-6">
        {!current.isFinal ? (
          <View className="items-center">
            <View className="flex-row gap-2 mb-6">
              {slides.map((s, i) => (
                <View
                  key={s.key}
                  className={`h-2 rounded-full ${
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </View>

            <Pressable
              onPress={goNext}
              className="w-full bg-white rounded-full py-4 items-center"
            >
              <Text className="text-primary text-base font-bold">Next</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-2">
              {slides.map((s, i) => (
                <View
                  key={s.key}
                  className={`h-2 rounded-full ${
                    i === index ? "w-6 bg-ink" : "w-2 bg-ink/30"
                  }`}
                />
              ))}
            </View>

            <Pressable
              onPress={finish}
              className="w-14 h-14 rounded-full bg-ink items-center justify-center"
            >
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
