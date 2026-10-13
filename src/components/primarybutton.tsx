// src/components/PrimaryButton.tsx
import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "white" | "outline";
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: Props) {
  const isWhite = variant === "white";
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full items-center justify-center rounded-full py-4 ${
        isWhite
          ? "bg-white"
          : isOutline
            ? "bg-transparent border border-primary"
            : "bg-primary"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Text
        className={`text-base font-bold ${
          isWhite || isOutline ? "text-primary" : "text-white"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
