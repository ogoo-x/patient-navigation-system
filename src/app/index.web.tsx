import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export default function Landing() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const reduceMotion = useReducedMotion();

  const enterApp = () => router.push({ pathname: "/(tabs)/map" });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <MarketingHeader />

      <View
        style={{
          minHeight: Math.max(isDesktop ? 560 : 640, height - 80),
        }}
        className={`justify-center ${isDesktop ? "px-10" : "px-6 pb-8"}`}
      >
        <View
          className={`w-full max-w-6xl self-center ${
            isDesktop ? "flex-row items-center" : "items-center"
          }`}
        >
          <View className={isDesktop ? "flex-1 pr-12" : "w-full"}>
            <Text className="text-primary font-semibold text-base mb-4">
              YOUR HOSPITAL CAMPUS GUIDE
            </Text>
            <Text
              className={`text-ink font-bold leading-tight ${
                isDesktop ? "text-6xl" : "text-5xl"
              }`}
            >
              Find your way to care.
            </Text>
            <Text className="text-ink-muted text-lg leading-8 mt-5 max-w-xl">
              Get simple directions to clinics, wards, and services across NAUTH
              Akamili, our first supported campus. Know where you’re going
              before you take a step.
            </Text>
            <View
              className={
                isDesktop
                  ? "flex-row flex-wrap items-center gap-3 mt-8"
                  : "mt-8 w-full max-w-md flex-col items-stretch gap-3"
              }
            >
              <ExploreButton onPress={enterApp} />
              {Platform.OS === "web" && (
                <Link
                  href="/https://github.com/ogoo-x/patient-navigation-system/releases/latest/download/bubbles.apk"
                  asChild
                >
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Download our APK and use offline"
                    className={
                      isDesktop
                        ? "rounded-full border border-border bg-white px-6 py-4 shadow-sm hover:opacity-80 active:opacity-80"
                        : "w-full rounded-full border border-border bg-white px-6 py-4 shadow-sm hover:opacity-80 active:opacity-80"
                    }
                  >
                    <Text className="text-ink font-semibold text-base text-center">
                      Download our APK and use offline
                    </Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </View>

          <View
            className={
              isDesktop ? "flex-1 items-center justify-center" : "mt-8"
            }
          >
            <Image
              source={require("../../assets/Onboarding Illustration 1.png")}
              contentFit="contain"
              accessibilityLabel="Bubbles mascot exploring a hospital campus"
              className={isDesktop ? "bubbles-hero-float" : ""}
              style={{
                width: isDesktop ? Math.min(width * 0.4, 480) : width * 0.78,
                height: isDesktop ? Math.min(width * 0.4, 480) : 240,
              }}
            />
          </View>
        </View>
      </View>
      <HowItWorks isDesktop={isDesktop} reduceMotion={reduceMotion} />
      <MarketingFooter />
    </ScrollView>
  );
}

function HowItWorks({
  isDesktop,
  reduceMotion,
}: {
  isDesktop: boolean;
  reduceMotion: boolean;
}) {
  const sectionRef = useRef<View>(null);
  const animationStarted = useRef(false);
  const [activeStep, setActiveStep] = useState(-1);
  const steps = [
    {
      icon: "phone-portrait-outline" as const,
      caption: "Open the website or app",
    },
    {
      icon: "search-outline" as const,
      caption: "Select where you are going",
    },
    {
      icon: "navigate-outline" as const,
      caption: "Get a path made just for you",
    },
  ];

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const element = sectionRef.current as unknown as Element | null;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animationStarted.current) return;
        animationStarted.current = true;
        observer.disconnect();
        if (reduceMotion) {
          setActiveStep(steps.length - 1);
          return;
        }

        setActiveStep(0);
        let nextStep = 1;
        const timer = window.setInterval(() => {
          setActiveStep(nextStep);
          nextStep += 1;
          if (nextStep === steps.length) window.clearInterval(timer);
        }, 260);
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion, steps.length]);

  return (
    <View ref={sectionRef} className="w-full items-center bg-field px-6 py-16">
      <View className="w-full max-w-5xl">
        <Text className="text-ink text-3xl font-bold text-center">
          Never get lost
        </Text>
        <Text className="text-ink-muted text-base text-center mt-3 mb-10">
          Three simple steps to find your way around campus.
        </Text>
        <View
          className={`items-center ${
            isDesktop ? "flex-row justify-center" : "w-full"
          }`}
        >
          {steps.map((step, index) => {
            const active = index <= activeStep;
            return (
              <Fragment key={step.caption}>
                <View
                  accessibilityRole="summary"
                  className={`bubbles-step-card rounded-3xl border items-center justify-center px-5 py-6 ${
                    isDesktop ? "flex-1 min-h-44" : "w-full"
                  } ${
                    active
                      ? "border-primary bg-primary"
                      : "border-border bg-white"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                      active ? "bg-accent" : "bg-surface"
                    }`}
                  >
                    <Text className="text-ink font-bold">{index + 1}</Text>
                  </View>
                  <Ionicons
                    name={step.icon}
                    size={25}
                    color={active ? "white" : "#6B7280"}
                  />
                  <Text
                    className={`text-center font-semibold mt-3 ${
                      active ? "text-white" : "text-ink"
                    }`}
                  >
                    {step.caption}
                  </Text>
                </View>
                {index < steps.length - 1 && (
                  <View
                    className={`overflow-hidden rounded-full bg-border ${
                      isDesktop ? "h-1 w-12 mx-2" : "h-8 w-1 ml-6 self-start"
                    }`}
                  >
                    <View
                      className={`bubbles-step-fill rounded-full bg-primary ${
                        isDesktop ? "h-full" : "w-full"
                      }`}
                      style={
                        isDesktop
                          ? { width: activeStep > index ? "100%" : "0%" }
                          : { height: activeStep > index ? "100%" : "0%" }
                      }
                    />
                  </View>
                )}
              </Fragment>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ExploreButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Explore campus"
      className="self-start rounded-full bg-primary px-6 py-3 flex-row items-center shadow-sm"
    >
      <Ionicons name="compass-outline" size={19} color="white" />
      <Text className="font-bold text-base ml-2 text-white">
        Explore campus
      </Text>
    </Pressable>
  );
}
