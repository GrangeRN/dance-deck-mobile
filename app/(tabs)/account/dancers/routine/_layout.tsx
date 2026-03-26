import { Stack } from "expo-router";

export default function RoutineLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="[routineId]" />
    </Stack>
  );
}
