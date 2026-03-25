import { View, Text } from "react-native";

type BadgeVariant = "approved" | "pending" | "personal" | "teacher" | "admin" | "owner";

const variants: Record<BadgeVariant, { bg: string; text: string }> = {
  approved: { bg: "bg-badge-approved-bg", text: "text-badge-approved-text" },
  pending: { bg: "bg-badge-pending-bg", text: "text-badge-pending-text" },
  personal: { bg: "bg-badge-personal-bg", text: "text-badge-personal-text" },
  teacher: { bg: "bg-badge-teacher-bg", text: "text-badge-teacher-text" },
  admin: { bg: "bg-badge-admin-bg", text: "text-badge-admin-text" },
  owner: { bg: "bg-badge-owner-bg", text: "text-badge-owner-text" },
};

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

export function Badge({ label, variant }: BadgeProps) {
  const v = variants[variant];
  return (
    <View className={`${v.bg} rounded-pill px-3 py-1`}>
      <Text className={`${v.text} font-body-medium text-xs`}>{label}</Text>
    </View>
  );
}
