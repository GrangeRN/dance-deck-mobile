import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { gradients } from "@/lib/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <View className="flex-1 items-center justify-center px-page-mobile">
        <Text className="font-display text-5xl text-txt-primary text-center">
          DanceDeck
        </Text>
        <Text className="font-body text-base text-txt-secondary mt-3 text-center max-w-[280px]">
          Your competition day command center
        </Text>

        <View className="w-full mt-16 gap-4">
          <Pressable onPress={() => router.push({ pathname: "/(auth)/signup", params: { mode: "signup" } })}>
            <LinearGradient
              colors={[...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
            >
              <Text className="font-body-medium text-base text-txt-primary">
                Create Account
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/(auth)/signup", params: { mode: "login" } })}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: "#C084FC", paddingVertical: 14, alignItems: "center" }}
          >
            <Text className="font-body-medium text-base text-accent-violet">
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>

      <Text className="font-body text-xs text-txt-muted text-center pb-4">
        The Granger Collective
      </Text>
    </SafeAreaView>
  );
}
