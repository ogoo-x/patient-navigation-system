import { Slot } from "expo-router";
import { ScrollView, View } from "react-native";
import MarketingFooter from "../../components/marketing/MarketingFooter";
import MarketingHeader from "../../components/marketing/MarketingHeader";

export default function MarketingLayout() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <MarketingHeader showBackHome />
      <View className="flex-1">
        <Slot />
      </View>
      <MarketingFooter />
    </ScrollView>
  );
}
