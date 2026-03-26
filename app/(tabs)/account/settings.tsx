import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [notify30min, setNotify30min] = useState(true);
  const [notify15min, setNotify15min] = useState(true);
  const [notifyAtTime, setNotifyAtTime] = useState(false);
  const [vibrateOnly, setVibrateOnly] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Contact Support", "To delete your account, email support@dancedeck.app");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-2xl text-txt-primary">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Notifications */}
        <View className="px-page-mobile">
          <Text className="font-body-medium text-sm text-txt-secondary mb-3">
            CALLTIME NOTIFICATIONS
          </Text>
          <View className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-6">
            <View className="flex-row items-center justify-between p-4">
              <Text className="font-body text-base text-txt-primary">30 minutes before</Text>
              <Switch value={notify30min} onValueChange={setNotify30min} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
            </View>
            <View className="h-px bg-border-subtle mx-4" />
            <View className="flex-row items-center justify-between p-4">
              <Text className="font-body text-base text-txt-primary">15 minutes before</Text>
              <Switch value={notify15min} onValueChange={setNotify15min} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
            </View>
            <View className="h-px bg-border-subtle mx-4" />
            <View className="flex-row items-center justify-between p-4">
              <Text className="font-body text-base text-txt-primary">At calltime</Text>
              <Switch value={notifyAtTime} onValueChange={setNotifyAtTime} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
            </View>
            <View className="h-px bg-border-subtle mx-4" />
            <View className="flex-row items-center justify-between p-4">
              <Text className="font-body text-base text-txt-primary">Vibrate only (theater mode)</Text>
              <Switch value={vibrateOnly} onValueChange={setVibrateOnly} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
            </View>
          </View>

          {/* Account */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-3">
            ACCOUNT
          </Text>
          <View className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-6">
            <View className="p-4">
              <Text className="font-body text-sm text-txt-muted">Email</Text>
              <Text className="font-body text-base text-txt-primary mt-0.5">{user?.email}</Text>
            </View>
          </View>

          {/* About */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-3">
            ABOUT
          </Text>
          <View className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-6">
            <View className="p-4">
              <Text className="font-body text-base text-txt-primary">DanceDeck v1.0.0</Text>
              <Text className="font-body text-sm text-txt-muted mt-0.5">The Granger Collective</Text>
            </View>
          </View>

          {/* Danger Zone */}
          <Text className="font-body-medium text-sm text-status-danger mb-3">
            DANGER ZONE
          </Text>
          <Pressable
            onPress={handleDeleteAccount}
            className="bg-bg-card border border-status-danger/30 rounded-lg p-4"
          >
            <Text className="font-body-medium text-base text-status-danger">Delete Account</Text>
            <Text className="font-body text-sm text-txt-muted mt-0.5">
              Permanently delete your account and all data
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
