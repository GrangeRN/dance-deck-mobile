import { Tabs } from "expo-router";
import { Home, CalendarDays, Trophy, MessageCircle, User } from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.nav.active,
        tabBarInactiveTintColor: colors.nav.inactive,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="awards"
        options={{
          title: "Awards",
          tabBarIcon: ({ color, size }) => (
            <Trophy color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
