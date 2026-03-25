import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { gradients } from "@/lib/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center px-page-mobile">
      <Text className="font-display text-5xl text-txt-primary text-center">
        DanceDeck
      </Text>
      <Text className="font-body text-base text-txt-secondary mt-3 text-center">
        Your competition day command center
      </Text>

      <View className="w-full mt-12 gap-3">
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-md py-3 items-center"
          >
            <Text className="font-body-medium text-base text-txt-primary">
              Get Started
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/signup")}
          className="border border-accent-violet rounded-md py-3 items-center"
        >
          <Text className="font-body-medium text-base text-accent-violet">
            I Already Have an Account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
