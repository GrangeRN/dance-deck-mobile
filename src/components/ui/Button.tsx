import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@/lib/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "destructive";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} className="w-full">
        <LinearGradient
          colors={isDisabled ? ["#27272A", "#27272A"] : [...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-md py-3 px-5 items-center justify-center flex-row"
        >
          {loading && <ActivityIndicator size="small" color="#F4F4F5" className="mr-2" />}
          <Text
            className={`font-body-medium text-base ${isDisabled ? "text-txt-muted" : "text-txt-primary"}`}
          >
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "ghost") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`w-full rounded-md py-3 px-5 items-center justify-center border ${
          isDisabled ? "border-border-subtle" : "border-accent-violet"
        }`}
      >
        {loading && <ActivityIndicator size="small" color="#C084FC" className="mr-2" />}
        <Text
          className={`font-body-medium text-base ${isDisabled ? "text-txt-muted" : "text-accent-violet"}`}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  // destructive
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full rounded-md py-3 px-5 items-center justify-center ${
        isDisabled ? "bg-bg-input" : "bg-status-danger"
      }`}
    >
      {loading && <ActivityIndicator size="small" color="#F4F4F5" className="mr-2" />}
      <Text
        className={`font-body-medium text-base ${isDisabled ? "text-txt-muted" : "text-txt-primary"}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
