import { View } from "react-native";

interface ColorDotProps {
  color: string;
  size?: number;
  selected?: boolean;
}

export function ColorDot({ color, size = 32, selected = false }: ColorDotProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: selected ? 3 : 0,
        borderColor: "#F4F4F5",
      }}
    />
  );
}
