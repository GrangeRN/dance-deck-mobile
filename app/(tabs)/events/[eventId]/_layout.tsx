import { Stack } from "expo-router";

export default function EventDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="packing-list" />
      <Stack.Screen name="memory-notes" />
    </Stack>
  );
}
