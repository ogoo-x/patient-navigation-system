import { StyleSheet, Text, View } from "react-native";

export default function explore() {
  return (
    <View style={styles.wholeBox}>
      <Text>Explore...still alive {"\n"} Or is it?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wholeBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
