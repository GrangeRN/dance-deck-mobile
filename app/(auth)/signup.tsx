import { useState } from "react";
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import { Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { gradients } from "@/lib/theme";

export default function SignupScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (!isLogin && (!firstName || !lastName)) {
      Alert.alert("Missing fields", "Please enter your first and last name.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state listener in root layout handles navigation
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: "parent", // Default — changed in onboarding
            },
          },
        });
        if (error) throw error;
        router.replace("/(auth)/onboarding");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-page-mobile pt-4">
            <Pressable onPress={() => router.back()} className="mb-8">
              <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
            </Pressable>

            <Text className="font-display text-3xl text-txt-primary mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="font-body text-base text-txt-secondary mb-8">
              {isLogin
                ? "Sign in to your DanceDeck account"
                : "Get started with DanceDeck"}
            </Text>

            <View className="gap-4">
              {!isLogin && (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="First Name"
                      placeholder="Jessica"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Last Name"
                      placeholder="Granger"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <Input
                label="Password"
                placeholder={isLogin ? "Your password" : "At least 6 characters"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Pressable onPress={handleSubmit} disabled={loading} className="mt-2">
                <LinearGradient
                  colors={loading ? ["#27272A", "#27272A"] : [...gradients.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
                >
                  <Text className={`font-body-medium text-base ${loading ? "text-txt-muted" : "text-txt-primary"}`}>
                    {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.setParams({ mode: isLogin ? "signup" : "login" })
                }
                className="items-center mt-4"
              >
                <Text className="font-body text-sm text-txt-secondary">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text className="text-accent-violet font-body-medium">
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
