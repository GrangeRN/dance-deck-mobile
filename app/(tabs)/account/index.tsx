import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  UsersRound,
  CheckSquare,
  Award,
  Settings,
  CreditCard,
  Shield,
  ChevronRight,
  LogOut,
  Plus,
  UserPlus,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { Badge } from "@/components/ui";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  subtitle?: string;
}

function MenuItem({ icon, label, onPress, danger, subtitle }: MenuItemProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-4 px-4">
      <View className="mr-3">{icon}</View>
      <View className="flex-1">
        <Text className={`font-body text-base ${danger ? "text-status-danger" : "text-txt-primary"}`}>
          {label}
        </Text>
        {subtitle && (
          <Text className="font-body text-xs text-txt-muted mt-0.5">{subtitle}</Text>
        )}
      </View>
      {!danger && <ChevronRight color="#52525B" size={20} strokeWidth={1.5} />}
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { groups } = useGroups();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-page-mobile pt-6 pb-4">
          <Text className="font-display text-2xl text-txt-primary">Account</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-6">
          <View className="flex-row items-center">
            <View
              style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: "#4C1D95", alignItems: "center", justifyContent: "center",
              }}
            >
              <Text className="font-body-medium text-lg text-accent-violet">
                {user?.user_metadata?.first_name?.[0] || "?"}
                {user?.user_metadata?.last_name?.[0] || ""}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-body-medium text-lg text-txt-primary">
                {user?.user_metadata?.first_name || ""} {user?.user_metadata?.last_name || ""}
              </Text>
              <Text className="font-body text-sm text-txt-secondary">{user?.email || ""}</Text>
            </View>
            <Badge label="Parent" variant="approved" />
          </View>
        </View>

        {/* Groups Section */}
        <View className="mx-page-mobile mb-4">
          <View className="flex-row items-center mb-3">
            <Text className="font-body-medium text-sm text-txt-secondary flex-1">
              YOUR GROUPS
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/account/group/create")} className="mr-3">
              <Plus color="#C084FC" size={18} strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/account/group/join")}>
              <UserPlus color="#C084FC" size={18} strokeWidth={1.5} />
            </Pressable>
          </View>

          {groups.length === 0 ? (
            <View className="bg-bg-card border border-border-subtle rounded-lg p-card-pad">
              <Text className="font-body text-sm text-txt-secondary text-center">
                No groups yet. Create one or join with a code.
              </Text>
            </View>
          ) : (
            <View className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
              {groups.map((g, i) => (
                <View key={g.id}>
                  {i > 0 && <View className="h-px bg-border-subtle mx-4" />}
                  <MenuItem
                    icon={<UsersRound color="#C084FC" size={20} strokeWidth={1.5} />}
                    label={g.name}
                    subtitle={g.myStatus === "pending" ? "Pending approval" : `${g.memberCount} members`}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/account/group/[groupId]",
                        params: { groupId: g.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Main Menu */}
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

        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
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
