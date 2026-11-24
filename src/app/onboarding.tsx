import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Animated,
  Pressable,
  Platform,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const cards = [
  {
    key: "explore",
    title: "Find the places you need",
    body: "Explore clinics, wards, and services across your hospital campus with clear directions.",
    icon: "navigate" as const,
    accent: "#187FF6",
    label: "Explore with confidence",
    detail: "Know where you are going",
  },
  {
    key: "save",
    title: "Save places you need",
    body: "Keep your important clinics and hospital locations close at hand.",
    icon: "bookmark" as const,
    accent: "#D8AC00",
    label: "Your places, together",
    detail: "Clinics · wards · entrances",
  },
  {
    key: "guide",
    title: "A calmer way to get there",
    body: "Get simple directions and helpful guidance, all in one place.",
    icon: "map" as const,
    accent: "#0F766E",
    label: "Made for your campus",
    detail: "Your campus navigation guide",
  },
];

const TOTAL_STEPS = cards.length + 2;
const FINAL_STEP = TOTAL_STEPS - 1;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const cardWidth = Math.min(width * 0.84, 420);
  const cardStep = cardWidth + 14;
  const sidePadding = (width - cardWidth) / 2;
  const slideHeight = Math.max(
    360,
    Math.min(height - insets.top - insets.bottom - 155, 620),
  );
  const snapOffsets = Array.from(
    { length: TOTAL_STEPS - 1 },
    (_, index) => width + index * cardStep,
  );
  const isFinal = activeIndex === FINAL_STEP;

  const finish = () => router.replace({ pathname: "/(tabs)/map" });

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const nextIndex =
      offset < width / 2
        ? 0
        : Math.min(
            FINAL_STEP,
            Math.max(1, 1 + Math.round((offset - width) / cardStep)),
          );
    if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
  };

  const scaleForStep = (step: number) => ({
    transform: [
      {
        scaleY: scrollX.interpolate({
          inputRange: [
            width + (step - 2) * cardStep,
            width + (step - 1) * cardStep,
            width + step * cardStep,
          ],
          outputRange: [0.92, 1, 0.92],
          extrapolate: "clamp",
        }),
      },
    ],
  });

  return (
    <View className={`flex-1 ${isFinal ? "bg-accent" : "bg-primary"}`}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: Platform.OS !== "web", listener: onScroll },
        )}
        scrollEventThrottle={16}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 110 + insets.bottom,
          alignItems: "center",
        }}
      >
        <View
          style={{ width, height: slideHeight }}
          className="items-center justify-center px-5"
        >
          <Text className="text-white text-3xl font-bold text-center">
            Explore your campus
          </Text>
          <Text className="text-white/90 text-base leading-6 text-center mt-3">
            Your friendly guide to finding your way around the hospital.
          </Text>
          <Image
            source={require("../../assets/Onboarding Illustration 1.png")}
            contentFit="contain"
            accessibilityLabel="Bubbles looking through a telescope at campus places"
            style={{
              width: cardWidth,
              height: slideHeight * 0.57,
              marginTop: 16,
            }}
          />
          <Text className="text-white font-semibold text-center mt-2">
            Swipe to explore
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: sidePadding,
          }}
        >
          {cards.map((card, index) => (
            <Animated.View
              key={card.key}
              style={[
                { width: cardWidth, height: slideHeight },
                scaleForStep(index + 1),
              ]}
              className="rounded-3xl bg-white p-5"
            >
              <View className="flex-1 rounded-3xl bg-[#F3F6FF] items-center justify-center overflow-hidden">
                <View className="absolute left-9 right-9 top-1/2 h-1 bg-primary/20 rounded-full" />
                <View className="absolute top-[24%] left-[20%] w-20 h-20 rounded-3xl bg-white items-center justify-center">
                  <Ionicons name={card.icon} size={40} color={card.accent} />
                </View>
                <View className="absolute right-[17%] bottom-[23%] w-16 h-16 rounded-full bg-white items-center justify-center">
                  <Ionicons name="location" size={30} color="#0F766E" />
                </View>
                <View className="absolute left-[24%] bottom-[17%] flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  <View className="w-20 h-1 bg-primary/50" />
                  <View className="w-3 h-3 rounded-full bg-accent border-2 border-white" />
                </View>
              </View>
              <View className="rounded-2xl border border-border p-4 mt-4 flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name={card.icon} size={22} color={card.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-ink font-bold">{card.label}</Text>
                  <Text className="text-ink-muted text-sm mt-0.5">
                    {card.detail}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={21} color="#0F766E" />
              </View>
              <Text className="text-ink text-xl font-bold text-center mt-5">
                {card.title}
              </Text>
              <Text className="text-ink-muted text-sm leading-5 text-center mt-2">
                {card.body}
              </Text>
            </Animated.View>
          ))}

          <Animated.View
            style={[
              { width: cardWidth, height: slideHeight },
              scaleForStep(FINAL_STEP),
            ]}
            className="items-center justify-center"
          >
            <Pressable
              onPress={finish}
              accessibilityRole="button"
              className="flex-row items-center justify-center px-6 py-4"
            >
              <Text className="text-ink text-lg font-bold mr-4">
                Get started
              </Text>
              <View className="w-11 h-11 rounded-full bg-black items-center justify-center">
                <Ionicons name="arrow-forward" size={22} color="#EFC718" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <View
        className="absolute left-0 right-0 items-center"
        style={{ bottom: insets.bottom + 28 }}
        pointerEvents="none"
      >
        <ProgressDots activeIndex={activeIndex} />
      </View>
    </View>
  );
}

function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View className="flex-row items-center gap-3">
      {Array.from({ length: TOTAL_STEPS }, (_, step) => (
        <View
          key={step}
          className={`rounded-full ${
            step === activeIndex ? "w-3 h-3 bg-white" : "w-2 h-2 bg-white/40"
          }`}
        />
      ))}
    </View>
  );
}
