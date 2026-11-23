import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../lib/AuthProvider";
import { BIRD_AVATARS, getBirdEmoji, type BirdAvatarId } from "../lib/birds";

function getNextPath(value?: string | string[]): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/(tabs)/map";
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const birdCardWidth = Math.min(width * 0.78, 320);
  const birdStep = birdCardWidth + 16;
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextPath = getNextPath(params.next);
  const {
    user,
    isLoading: authLoading,
    signInWithUsername,
    signUpWithUsername,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBird, setSelectedBird] = useState<BirdAvatarId | null>(null);
  const [activeBirdIndex, setActiveBirdIndex] = useState(0);
  const [birdPickerOpen, setBirdPickerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const birdScrollRef = useRef<ScrollView>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const navigateNext = useCallback(
    () => router.replace(nextPath as Href),
    [nextPath, router],
  );
  useEffect(() => {
    if (!authLoading && user) navigateNext();
  }, [authLoading, navigateNext, user]);

  const validateCredentials = () => {
    setMessage(null);
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setMessage(
        "Use 3–24 letters, numbers, or underscores for your username.",
      );
      return null;
    }
    if (password.length < 8 || password.length > 72) {
      setMessage("Your password must be between 8 and 72 characters.");
      return null;
    }
    return normalizedUsername;
  };

  const submit = async () => {
    const normalizedUsername = validateCredentials();
    if (!normalizedUsername) return;
    if (isSignUp) {
      setSelectedBird(null);
      setActiveBirdIndex(0);
      setBirdPickerOpen(true);
      requestAnimationFrame(() =>
        birdScrollRef.current?.scrollTo({ x: 0, animated: false }),
      );
      return;
    }

    setWorking(true);
    try {
      await signInWithUsername(normalizedUsername, password);
      navigateNext();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not authenticate.",
      );
    } finally {
      setWorking(false);
    }
  };

  const createAccount = async () => {
    const normalizedUsername = validateCredentials();
    if (!normalizedUsername || !selectedBird) {
      setMessage("Choose a bird to continue.");
      return;
    }
    setWorking(true);
    try {
      await signUpWithUsername(normalizedUsername, password, selectedBird);
      setBirdPickerOpen(false);
      navigateNext();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create account.",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleBirdScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.max(
      0,
      Math.min(
        BIRD_AVATARS.length - 1,
        Math.round(event.nativeEvent.contentOffset.x / birdStep),
      ),
    );
    if (nextIndex !== activeBirdIndex) {
      setActiveBirdIndex(nextIndex);
      setSelectedBird(BIRD_AVATARS[nextIndex].id);
    }
  };

  const chooseBird = (birdId: BirdAvatarId) => {
    setSelectedBird(birdId);
    setActiveBirdIndex(BIRD_AVATARS.findIndex((bird) => bird.id === birdId));
  };

  if (!authLoading && user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#187FF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-5 pt-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-11 h-11 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="arrow-back" size={21} color="#111827" />
        </Pressable>
      </View>
      <View className="flex-1 justify-center px-6 pb-8">
        <View className="w-full max-w-md self-center">
          <Text className="text-primary text-3xl font-bold text-center">
            {isSignUp ? "Choose your username" : "Welcome to Bubbles"}
          </Text>
          <Text className="text-ink-muted text-center leading-6 mt-2 mb-7">
            {isSignUp
              ? "Create your Bubbles account with a username and password."
              : "Sign in with your Bubbles username and password."}
          </Text>

          <View className="h-12 flex-row items-center rounded-xl border border-border px-4">
            <Ionicons name="person-outline" size={19} color="#6B7280" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              className="flex-1 ml-3 text-ink"
              returnKeyType="next"
            />
          </View>
          <View className="h-12 flex-row items-center rounded-xl border border-border px-4 mt-3">
            <Ionicons name="lock-closed-outline" size={19} color="#6B7280" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (at least 8 characters)"
              secureTextEntry={!showPassword}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              textContentType={isSignUp ? "newPassword" : "password"}
              className="flex-1 ml-3 text-ink"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            <Pressable
              onPress={() => setShowPassword((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              hitSlop={10}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6B7280"
              />
            </Pressable>
          </View>
          {message ? (
            <Text className="text-red-600 text-sm leading-5 mt-3">
              {message}
            </Text>
          ) : null}
          <Pressable
            onPress={() => void submit()}
            disabled={working}
            accessibilityRole="button"
            className="h-12 rounded-full bg-primary items-center justify-center mt-5"
          >
            {working ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold">
                {isSignUp ? "Create account" : "Sign in"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSignUp((current) => !current);
              setMessage(null);
              setSelectedBird(null);
            }}
            className="py-4 items-center"
          >
            <Text className="text-primary font-semibold">
              {isSignUp
                ? "Already have an account? Sign in"
                : "New to Bubbles? Create an account"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace({ pathname: "/(tabs)/map" })}
            accessibilityRole="button"
            className="h-12 flex-row items-center justify-center rounded-full border border-primary mt-2"
          >
            <Ionicons name="compass-outline" size={18} color="#187FF6" />
            <Text className="text-primary font-bold ml-2">
              Explore campus as a guest
            </Text>
          </Pressable>
        </View>
      </View>
      <Modal
        visible={birdPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!working) setBirdPickerOpen(false);
        }}
      >
        <View className="flex-1 bg-black/55 justify-center items-center px-4">
          <View
            className="w-full max-w-md rounded-3xl bg-white py-6"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="items-center px-6">
              <Text className="text-primary text-xs font-bold uppercase tracking-widest">
                Character select
              </Text>
              <Text className="text-ink text-2xl font-bold text-center mt-2">
                Choose your bird
              </Text>
              <Text className="text-ink-muted text-sm text-center mt-1">
                Swipe through the flock and pick your Bubbles avatar.
              </Text>
            </View>
            <ScrollView
              ref={birdScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={birdStep}
              decelerationRate="fast"
              disableIntervalMomentum
              onScroll={handleBirdScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingHorizontal: Math.max(12, (width - birdCardWidth) / 2),
                gap: 16,
                paddingTop: 22,
                paddingBottom: 8,
              }}
            >
              {BIRD_AVATARS.map((bird) => {
                const selected = selectedBird === bird.id;
                return (
                  <Pressable
                    key={bird.id}
                    onPress={() => chooseBird(bird.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${bird.label}`}
                    accessibilityState={{ selected }}
                    className={`items-center rounded-3xl border-2 px-5 py-5 ${
                      selected
                        ? "border-accent bg-[#FFFBE6]"
                        : "border-border bg-[#F8FAFC]"
                    }`}
                    style={{ width: birdCardWidth, minHeight: 285 }}
                  >
                    <View className="w-28 h-28 rounded-full bg-white items-center justify-center border border-border">
                      <Text className="text-7xl">{getBirdEmoji(bird.id)}</Text>
                    </View>
                    <Text className="text-ink text-xl font-bold mt-4">
                      {bird.label}
                    </Text>
                    <Text className="text-ink-muted text-sm text-center leading-5 mt-2">
                      {bird.fact}
                    </Text>
                    <View className="mt-4 rounded-full bg-primary/10 px-4 py-2">
                      <Text className="text-primary text-sm font-bold">
                        Chances of spotting it around: {bird.africaOdds}%
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="flex-row justify-center items-center gap-2 mt-2">
              {BIRD_AVATARS.map((bird, index) => (
                <View
                  key={bird.id}
                  className={`rounded-full ${
                    index === activeBirdIndex
                      ? "w-2.5 h-2.5 bg-primary"
                      : "w-2 h-2 bg-primary/25"
                  }`}
                />
              ))}
            </View>
            <Text className="text-ink-muted text-[10px] text-center mt-2 px-6">
              Not real wildlife statistics.
            </Text>
            {message ? (
              <Text className="text-red-600 text-sm text-center mt-3 px-6">
                {message}
              </Text>
            ) : null}
            <View className="flex-row items-center px-5 mt-5">
              <Pressable
                onPress={() => {
                  setBirdPickerOpen(false);
                  setMessage(null);
                }}
                disabled={working}
                className="h-12 flex-1 items-center justify-center mr-3 rounded-full border border-border"
              >
                <Text className="text-ink-muted font-semibold">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => void createAccount()}
                disabled={working || !selectedBird}
                accessibilityRole="button"
                className={`h-12 flex-1 flex-row items-center justify-center rounded-full ${
                  selectedBird ? "bg-primary" : "bg-primary/40"
                }`}
              >
                {working ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-bold mr-2">
                      Choose{" "}
                      {selectedBird
                        ? BIRD_AVATARS.find((bird) => bird.id === selectedBird)
                            ?.label
                        : "a bird"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
