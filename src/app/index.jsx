// app/index.tsx  (mobile only)
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function index() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/onboarding"); // or straight to /(tabs)/map if you skip onboarding later
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#187FF6",
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
        Patient Nav
      </Text>
    </View>
  );
}
