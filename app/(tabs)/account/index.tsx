import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  CheckSquare,
  Award,
  Settings,
  CreditCard,
  Shield,
  ChevronRight,
  LogOut,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-4"
    >
      <View className="mr-3">{icon}</View>
      <Text
        className={`flex-1 font-body text-base ${danger ? "text-status-danger" : "text-txt-primary"}`}
      >
        {label}
      </Text>
      {!danger && <ChevronRight color="#52525B" size={20} strokeWidth={1.5} />}
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-page-mobile pt-6 pb-4">
          <Text className="font-display text-2xl text-txt-primary">
            Account
          </Text>
        </View>

        {/* Profile Card */}
        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-6">
          <View className="flex-row items-center">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#4C1D95",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="font-body-medium text-lg text-accent-violet">
                {user?.user_metadata?.first_name?.[0] || "?"}
                {user?.user_metadata?.last_name?.[0] || ""}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-body-medium text-lg text-txt-primary">
                {user?.user_metadata?.first_name || ""}{" "}
                {user?.user_metadata?.last_name || ""}
              </Text>
              <Text className="font-body text-sm text-txt-secondary">
                {user?.email || ""}
              </Text>
            </View>
            <Badge label="Parent" variant="approved" />
          </View>
        </View>

        {/* Menu */}
        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-4">
          <MenuItem
            icon={<Users color="#C084FC" size={20} strokeWidth={1.5} />}
            label="Dancer Profiles"
            onPress={() => router.push("/(tabs)/account/dancers")}
          />
          <View className="h-px bg-border-subtle mx-4" />
          <MenuItem
            icon={<CheckSquare color="#C084FC" size={20} strokeWidth={1.5} />}
            label="Packing Lists"
            onPress={() => {}}
          />
          <View className="h-px bg-border-subtle mx-4" />
          <MenuItem
            icon={<Award color="#C084FC" size={20} strokeWidth={1.5} />}
            label="My Season"
            onPress={() => {}}
          />
        </View>

        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-4">
          <MenuItem
            icon={<Settings color="#A1A1AA" size={20} strokeWidth={1.5} />}
            label="Settings"
            onPress={() => router.push("/(tabs)/account/settings")}
          />
          <View className="h-px bg-border-subtle mx-4" />
          <MenuItem
            icon={<CreditCard color="#A1A1AA" size={20} strokeWidth={1.5} />}
            label="Manage Subscription"
            onPress={() => {}}
          />
          <View className="h-px bg-border-subtle mx-4" />
          <MenuItem
            icon={<Shield color="#A1A1AA" size={20} strokeWidth={1.5} />}
            label="Studio Admin"
            onPress={() => router.push("/(tabs)/account/studio-admin")}
          />
        </View>

        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg overflow-hidden mb-8">
          <MenuItem
            icon={<LogOut color="#F87171" size={20} strokeWidth={1.5} />}
            label="Sign Out"
            onPress={signOut}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
