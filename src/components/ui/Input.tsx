import { TextInput, View, Text } from "react-native";
import { useState } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border ${
          focused ? "border-accent-violet" : "border-border"
        }`}
      />
    </View>
  );
}
