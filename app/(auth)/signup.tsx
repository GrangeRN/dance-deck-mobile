import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Mail } from "lucide-react-native";
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
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!isLogin && (!firstName || !lastName)) {
      setError("Please enter your first and last name.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: "parent",
            },
          },
        });
        if (authError) throw authError;

        if (data?.user && !data.session) {
          setCheckEmail(true);
        } else {
          router.replace("/(auth)/onboarding");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Check Your Email Screen ──────────────────────────────
  if (checkEmail) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary">
        <View className="flex-1 items-center justify-center px-page-mobile">
          <View
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: "#4C1D95", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Mail color="#C084FC" size={32} strokeWidth={1.5} />
          </View>
          <Text className="font-display text-2xl text-txt-primary text-center mb-3">
            Check Your Email
          </Text>
          <Text className="font-body text-base text-txt-secondary text-center mb-2">
            We sent a confirmation link to:
          </Text>
          <Text className="font-body-medium text-base text-accent-violet text-center mb-8">
            {email}
          </Text>
          <Text className="font-body text-sm text-txt-muted text-center mb-8">
            Open the link in your email to activate your account, then come back here and sign in.
          </Text>

          <Pressable
            onPress={() => {
              setCheckEmail(false);
              router.setParams({ mode: "login" });
            }}
          >
            <LinearGradient
              colors={[...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" }}
            >
              <Text className="font-body-medium text-base text-txt-primary">
                Go to Sign In
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Sign Up / Sign In Form ───────────────────────────────
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

            {/* Error Message */}
            {error ? (
              <View className="bg-status-danger/10 border border-status-danger/30 rounded-md px-4 py-3 mb-4">
                <Text className="font-body text-sm text-status-danger">{error}</Text>
              </View>
            ) : null}

            <View className="gap-4">
              {!isLogin && (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="First Name"
                      placeholder="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Last Name"
                      placeholder="Last name"
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
                onPress={() => {
                  setError("");
                  router.setParams({ mode: isLogin ? "signup" : "login" });
                }}
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
