import { useMemo } from "react";
import { PanResponder, View } from "react-native";

export default function SheetHandle({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 48) onDismiss();
        },
      }),
    [onDismiss],
  );

  return (
    <View
      {...responder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel="Swipe down to dismiss"
      className="h-10 items-center justify-center"
    >
      <View className="w-10 h-1 rounded-full bg-border" />
    </View>
  );
}
