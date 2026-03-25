import { View } from "react-native";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`bg-bg-card border border-border-subtle rounded-lg p-card-pad ${className}`}>
      {children}
    </View>
  );
}
