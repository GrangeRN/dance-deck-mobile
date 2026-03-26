import { Stack } from "expo-router";

export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="join" />
      <Stack.Screen name="[groupId]" />
    </Stack>
  );
}
