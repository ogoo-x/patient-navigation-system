import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../lib/AuthProvider";
import { getBirdEmoji } from "../../../lib/birds";
import { formatDistance } from "../../../lib/eta";
import { getPrimaryClinic } from "../../../lib/primaryClinicStore";
import { getPlaceById } from "../../../lib/searchPlaces";
import { getSavedPlaceIds } from "../../../lib/savedPlacesStore";
import { getVisits, type CompletedVisit } from "../../../lib/visitStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signOut, authError, claimUsername } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [visits, setVisits] = useState<CompletedVisit[]>([]);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [localClinicId, setLocalClinicId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        getVisits(user?.id),
        getSavedPlaceIds(user?.id),
        getPrimaryClinic(),
      ])
        .then(([nextVisits, savedIds, clinicId]) => {
          if (!active) return;
          setVisits(nextVisits);
          setSavedNames(
            savedIds.flatMap((id) => {
              const place = getPlaceById(id);
              return place ? [place.name] : [];
            }),
          );
          setLocalClinicId(clinicId);
        })
        .catch(() =>
          Alert.alert(
            "Profile data unavailable",
            "Some saved profile details could not be loaded.",
          ),
        );
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const primaryClinic = profile?.primary_clinic_id
    ? getPlaceById(profile.primary_clinic_id)?.name
    : localClinicId
      ? getPlaceById(localClinicId)?.name
      : undefined;
  const bird = profile?.bird ?? "parrot";
  const name =
    profile?.full_name ??
    (typeof user?.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (profile?.username ? `@${profile.username}` : user ? "Bubbles account" : "Guest");
  const avatarUri = profile?.avatar_url ?? null;

  const onClaimUsername = async () => {
    const normalizedUsername = newUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setClaimError("Use 3–24 letters, numbers, or underscores.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      setClaimError("Password must be between 8 and 72 characters.");
      return;
    }
    setClaimLoading(true);
    setClaimError(null);
    try {
      await claimUsername(normalizedUsername, newPassword);
      setNewUsername("");
      setNewPassword("");
      Alert.alert("Username set", "You can now sign in with your username.");
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : "Could not update account.");
    } finally {
      setClaimLoading(false);
    }
  };

  const onSignOut = async () => {
    setAccountMenuOpen(false);
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Could not sign out",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const onSwitchAccount = async () => {
    setAccountMenuOpen(false);
    if (user) {
      try {
        await signOut();
      } catch (error) {
        Alert.alert(
          "Could not switch account",
          error instanceof Error ? error.message : "Please try again.",
        );
        return;
      }
    }
    router.replace({
      pathname: "/login",
      params: { next: "/(tabs)/profile" },
    });
  };

  return (
    <View className="flex-1 bg-[#F5F7FB]" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3 flex-row items-center justify-between">
        <Text className="text-primary text-xl font-bold">Bubbles</Text>
        <Pressable
          onPress={() => setAccountMenuOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={
            accountMenuOpen ? "Close account menu" : "Open account menu"
          }
          accessibilityState={{ expanded: accountMenuOpen }}
          className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 items-center justify-center"
          style={{
            position: "relative",
            zIndex: 13,
            elevation: accountMenuOpen ? 13 : 1,
          }}
        >
          <Text className="text-lg">{getBirdEmoji(bird)}</Text>
          <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary items-center justify-center border-2 border-[#F5F7FB]">
            <Ionicons
              name={accountMenuOpen ? "chevron-up" : "chevron-down"}
              size={9}
              color="white"
            />
          </View>
        </Pressable>
      </View>
      {authError ? (
        <Text className="text-red-600 text-sm px-5 pb-2">{authError}</Text>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-5 mt-2 mb-4">
          <View className="w-24 h-24 rounded-full bg-primary/15 items-center justify-center overflow-hidden mb-3">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                className="w-24 h-24"
                accessibilityLabel={`${name}'s profile picture`}
              />
            ) : (
              <Text className="text-4xl">{getBirdEmoji(bird)}</Text>
            )}
          </View>
          <Text className="text-ink text-2xl font-bold">{name}</Text>
          <Text className="text-ink-muted text-sm mt-1">
            {profile?.username
              ? `@${profile.username}`
              : user
                ? "Username not set"
                : "Explore campus as a guest"}
          </Text>
        </View>

        {!user ? (
          <View className="px-5 mb-4">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/login",
                  params: { next: "/(tabs)/profile" },
                })
              }
              accessibilityRole="button"
              className="bg-primary rounded-2xl px-4 py-4 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
                <Ionicons name="person-add-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">
                  Sign in or create an account
                </Text>
                <Text className="text-white/85 text-sm mt-0.5">
                  Sync your saved places and profile
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color="white" />
            </Pressable>
          </View>
        ) : null}

        {user && profile && !profile.username ? (
          <View className="mx-5 mb-4 rounded-2xl border border-primary/20 bg-white p-4">
            <Text className="text-ink font-bold text-base">
              Set up username sign-in
            </Text>
            <Text className="text-ink-muted text-sm leading-5 mt-1 mb-3">
              This account was created before username sign-in. While you are
              signed in, choose a username and password to use from now on.
            </Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              className="h-12 rounded-xl border border-border px-3 text-ink"
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (at least 8 characters)"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              className="h-12 rounded-xl border border-border px-3 text-ink mt-2"
            />
            {claimError ? (
              <Text className="text-red-600 text-sm mt-2">{claimError}</Text>
            ) : null}
            <Pressable
              onPress={() => void onClaimUsername()}
              disabled={claimLoading}
              accessibilityRole="button"
              className="h-11 rounded-full bg-primary items-center justify-center mt-3"
            >
              <Text className="text-white font-bold">
                {claimLoading ? "Saving…" : "Save username and password"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-border">
            <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="medical" size={18} color="#187FF6" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs">Primary Clinic</Text>
              <Text className="text-ink font-semibold text-base">
                {primaryClinic ?? "Not set"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-5 mb-4 bg-white rounded-3xl border border-border overflow-hidden">
          <MenuRow
            icon="time-outline"
            title="Visit History"
            subtitle="Archived campus routes"
            trailing={`${visits.length} visits`}
            onPress={() => router.push("/(tabs)/profile/visitHistory")}
          />
          <MenuRow
            icon="git-branch-outline"
            title="Trip Summaries"
            subtitle="Distance and transport mode totals"
            onPress={() => router.push("/(tabs)/profile/tripSummary")}
          />
          <MenuRow
            icon="bookmark-outline"
            title="Saved Places"
            subtitle={
              savedNames.length
                ? savedNames.slice(0, 2).join(", ")
                : "Bookmark places from the map"
            }
            subtitleAccent
            onPress={() => router.push("/(tabs)/profile/savedPlaces")}
          />
          <MenuRow
            icon="settings-outline"
            title="Settings & Notifications"
            subtitle="Alerts, guidance options"
            last
            onPress={() => router.push("/(tabs)/profile/settings")}
          />
        </View>

        {user ? (
          <View className="mx-5 mb-4 bg-white rounded-2xl border border-border overflow-hidden">
            <MenuRow
              icon="log-out-outline"
              title="Sign out"
              subtitle="Sign out of your Bubbles account"
              last
              onPress={() => void onSignOut()}
            />
          </View>
        ) : null}

        <View className="mx-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#0F766E" />
              <Text className="text-ink font-bold text-lg ml-2">
                Recent Visits
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/profile/visitHistory")}
            >
              <Text className="text-primary font-semibold text-sm">
                View All
              </Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-3xl border border-border overflow-hidden">
            {visits.slice(0, 3).map((visit, i) => (
              <View
                key={visit.id}
                className={`flex-row px-4 py-3 ${
                  i < Math.min(visits.length, 3) - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons
                    name={visit.mode === "walk" ? "walk" : "car"}
                    size={18}
                    color="#187FF6"
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between">
                    <Text
                      className="text-ink font-semibold flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {visit.placeName}
                    </Text>
                    <Text className="text-ink-muted text-xs">
                      {new Date(visit.visitedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-ink-muted text-xs mt-0.5">
                    {new Date(visit.visitedAt).toLocaleString()}
                  </Text>
                  <Text className="text-primary text-xs mt-1">
                    {formatDistance(visit.distanceMeters)} · {visit.mode}
                  </Text>
                </View>
              </View>
            ))}
            {!visits.length ? (
              <Text className="text-ink-muted text-sm p-4">
                Completed routes will appear here.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
      {accountMenuOpen ? (
        <Pressable
          onPress={() => setAccountMenuOpen(false)}
          className="absolute inset-0"
          style={{ zIndex: 10 }}
          accessibilityLabel="Dismiss account menu"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="absolute right-4 top-16 w-64 rounded-2xl bg-primary p-2"
            style={{ top: insets.top + 56, zIndex: 12, elevation: 12 }}
          >
            <View className="px-3 py-3 border-b border-white/20">
              <Text className="text-white font-bold">
                {user ? name : "Welcome to Bubbles"}
              </Text>
              <Text className="text-white/80 text-xs mt-1" numberOfLines={1}>
                {profile?.username
                  ? `@${profile.username}`
                  : user
                    ? "Signed in"
                    : "You’re exploring as a guest"}
              </Text>
            </View>
            {user ? (
              <>
                <AccountMenuItem
                  icon="people-outline"
                  label="Switch account"
                  onPress={() => void onSwitchAccount()}
                />
                <AccountMenuItem
                  icon="log-out-outline"
                  label="Sign out"
                  onPress={() => void onSignOut()}
                />
              </>
            ) : (
              <AccountMenuItem
                icon="log-in-outline"
                label="Sign in"
                onPress={() => void onSwitchAccount()}
              />
            )}
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

function AccountMenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center rounded-xl px-3 py-3"
    >
      <Ionicons name={icon} size={19} color="white" />
      <Text className="text-white font-semibold ml-3">{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  trailing,
  subtitleAccent,
  last,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  trailing?: string;
  subtitleAccent?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#187FF6" />
      </View>
      <View className="flex-1">
        <Text className="text-ink font-semibold">{title}</Text>
        <Text
          className={`text-sm mt-0.5 ${
            subtitleAccent ? "text-primary" : "text-ink-muted"
          }`}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {trailing ? (
        <View className="bg-primary/10 px-2 py-1 rounded-full mr-2">
          <Text className="text-primary text-xs font-semibold">{trailing}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}
