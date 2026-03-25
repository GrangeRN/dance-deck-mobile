import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@/lib/theme";
import type { LucideIcon } from "lucide-react-native";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export function ScreenPlaceholder({ title, subtitle, icon: Icon }: Props) {
  return (
    <View className="flex-1 bg-bg-primary items-center justify-center px-page-mobile">
      {Icon && (
        <Icon color="#C084FC" size={48} strokeWidth={1.5} />
      )}
      <Text className="font-display text-2xl text-txt-primary mt-4 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="font-body text-base text-txt-secondary mt-2 text-center">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
