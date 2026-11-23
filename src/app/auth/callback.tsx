import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabase";

function safeNextPath(value?: string | string[]): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//")
    ? path
    : "/(tabs)/map";
}

export default function AuthCallback() {
  const router = useRouter();
  const {
    code,
    next,
    error: oauthError,
    error_description: errorDescription,
  } = useLocalSearchParams<{
    code?: string | string[];
    next?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const authCode = Array.isArray(code) ? code[0] : code;

    if (user) {
      router.replace(safeNextPath(next) as Href);
      return () => {
        active = false;
      };
    }
    if (isLoading) return;
    if (!supabase || !authCode) return;

    void supabase.auth
      .exchangeCodeForSession(authCode)
      .then(({ error: exchangeError }) => {
        if (!active) return;
        if (exchangeError) setError(exchangeError.message);
        else router.replace(safeNextPath(next) as Href);
      })
      .catch((exchangeError: Error) => {
        if (active) setError(exchangeError.message);
      });

    return () => {
      active = false;
    };
  }, [code, isLoading, next, router, user]);
  const errorMessage =
    error ??
    (Array.isArray(errorDescription) ? errorDescription[0] : errorDescription) ??
    (Array.isArray(oauthError) ? oauthError[0] : oauthError) ??
    (!isLoading && !user && !supabase
      ? "Supabase is not configured for this app."
      : !isLoading && !user && !code
        ? "The sign-in redirect did not include an authorization code."
        : null);

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      {errorMessage ? (
        <Text className="text-red-600 text-center">{errorMessage}</Text>
      ) : (
        <>
          <ActivityIndicator color="#187FF6" />
          <Text className="text-ink-muted mt-4">Completing sign in…</Text>
        </>
      )}
    </View>
  );
}
