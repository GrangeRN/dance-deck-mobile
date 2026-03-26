import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dancers" />
      <Stack.Screen name="group" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="studio-admin" />
    </Stack>
  );
}
