import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { BirdAvatarId } from "./birds";
import { supabase, supabaseConfigError } from "./supabase";

export type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bird: string | null;
  primary_clinic_id: string | null;
  updated_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  signInWithUsername: (username: string, password: string) => Promise<void>;
  signUpWithUsername: (
    username: string,
    password: string,
    bird: BirdAvatarId,
  ) => Promise<void>;
  claimUsername: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type UsernameAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  username?: string;
  error?: string;
};

async function callUsernameAuth(
  body: {
    action: "signIn" | "signUp" | "claimUsername";
    username: string;
    password: string;
    bird?: BirdAvatarId;
  },
): Promise<UsernameAuthResponse> {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is unavailable.");
  }
  const { data, error } = await supabase.functions.invoke<UsernameAuthResponse>(
    "username-auth",
    { body },
  );
  if (error) {
    if (error.context instanceof Response) {
      if (error.context.status === 404) {
        throw new Error(
          "Username sign-in is not enabled for this Supabase project yet. Deploy the username-auth function and run supabase/schema.sql.",
        );
      }
      const payload = (await error.context.clone().json().catch(() => null)) as
        | UsernameAuthResponse
        | null;
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);

  const upsertProfile = useCallback(async (user: User) => {
    if (!supabase) return;
    const metadata = user.user_metadata;
    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url, bird, primary_clinic_id, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    const row = {
      id: user.id,
      username:
        typeof metadata.username === "string"
          ? metadata.username
          : (existing?.username ?? null),
      full_name:
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : (existing?.full_name ?? null),
      avatar_url:
        typeof metadata.avatar_url === "string"
          ? metadata.avatar_url
          : (existing?.avatar_url ?? null),
      bird: existing?.bird ?? null,
      primary_clinic_id: existing?.primary_clinic_id ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select(
        "id, username, full_name, avatar_url, bird, primary_clinic_id, updated_at",
      )
      .single();
    if (error) throw error;
    setProfile(data as UserProfile);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setSession(data.session);
        setIsLoading(false);
        if (data.session?.user) {
          void upsertProfile(data.session.user).catch((profileError: Error) => {
            if (active) setAuthError(profileError.message);
          });
        }
      })
      .catch((error: Error) => {
        if (!active) return;
        setAuthError(error.message);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void Promise.resolve().then(() =>
          upsertProfile(nextSession.user).catch((error: Error) => {
            setAuthError(error.message);
          }),
        );
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [upsertProfile]);

  const requireClient = useCallback(() => {
    if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is unavailable.");
    setAuthError(null);
    return supabase;
  }, []);

  const signInWithUsername = useCallback(
    async (username: string, password: string) => {
      const client = requireClient();
      const result = await callUsernameAuth({
        action: "signIn",
        username,
        password,
      });
      if (!result.access_token || !result.refresh_token) {
        throw new Error("Sign-in did not return a valid session.");
      }
      const { error } = await client.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (error) throw error;
    },
    [requireClient],
  );

  const signUpWithUsername = useCallback(
    async (username: string, password: string, bird: BirdAvatarId) => {
      const client = requireClient();
      const result = await callUsernameAuth({
        action: "signUp",
        username,
        password,
        bird,
      });
      if (!result.access_token || !result.refresh_token) {
        throw new Error("Account created. Sign in with your new username.");
      }
      const { error } = await client.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (error) throw error;
    },
    [requireClient],
  );

  const signOut = useCallback(async () => {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }, [requireClient]);

  const updateProfile = useCallback(
    async (changes: Partial<UserProfile>) => {
      const currentUser = session?.user;
      if (!currentUser) return;
      const next = {
        id: currentUser.id,
        ...profile,
        ...changes,
        updated_at: new Date().toISOString(),
      };
      if (!supabase) {
        setProfile(next as UserProfile);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .upsert(next, { onConflict: "id" })
        .select(
          "id, username, full_name, avatar_url, bird, primary_clinic_id, updated_at",
        )
        .single();
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      setProfile(data as UserProfile);
    },
    [profile, session?.user],
  );

  const claimUsername = useCallback(
    async (username: string, password: string) => {
      const result = await callUsernameAuth({
        action: "claimUsername",
        username,
        password,
      });
      if (!result.username) {
        throw new Error("Your username could not be saved.");
      }
      await updateProfile({ username: result.username });
    },
    [updateProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      authError,
      signInWithUsername,
      signUpWithUsername,
      claimUsername,
      signOut,
      updateProfile,
    }),
    [
      authError,
      isLoading,
      profile,
      session,
      signInWithUsername,
      signUpWithUsername,
      claimUsername,
      signOut,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
