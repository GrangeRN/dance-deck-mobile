import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
