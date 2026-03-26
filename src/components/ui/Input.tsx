import { TextInput, View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";

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
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View className="w-full">
      {label && (
        <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-bg-input rounded-md border ${
          focused ? "border-accent-violet" : "border-border"
        }`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#52525B"
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-txt-primary font-body text-base px-4 py-3"
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden(!hidden)} className="pr-4">
            {hidden ? (
              <EyeOff color="#52525B" size={20} strokeWidth={1.5} />
            ) : (
              <Eye color="#A1A1AA" size={20} strokeWidth={1.5} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
