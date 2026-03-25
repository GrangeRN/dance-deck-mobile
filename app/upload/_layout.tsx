import { Stack } from "expo-router";

export default function UploadLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
