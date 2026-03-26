import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Camera, Image as ImageIcon, Type } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { gradients } from "@/lib/theme";

type Mode = "choose" | "text" | "processing";

export default function UploadScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [textContent, setTextContent] = useState("");
  const [processing, setProcessing] = useState(false);

  const parseProgram = async (payload: {
    image_base64?: string;
    image_media_type?: string;
    text_content?: string;
  }) => {
    setMode("processing");
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "parse-competition-program",
        { body: payload }
      );

      if (error) throw error;

      if (data?.entries) {
        // Navigate to review with parsed data
        router.replace({
          pathname: "/upload/review",
          params: { parsed: JSON.stringify(data) },
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No entries returned from parser");
      }
    } catch (err: any) {
      Alert.alert("Parsing Failed", err.message || "Could not parse the program. Try again or enter text manually.");
      setMode("choose");
    } finally {
      setProcessing(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to continue.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: false });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: "base64" as any,
    });

    const mediaType = asset.mimeType || "image/jpeg";
    await parseProgram({ image_base64: base64, image_media_type: mediaType });
  };

  const handleTextSubmit = () => {
    if (!textContent.trim()) {
      Alert.alert("Empty", "Please paste the program text.");
      return;
    }
    parseProgram({ text_content: textContent.trim() });
  };

  if (mode === "processing") {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#C084FC" />
        <Text className="font-body-medium text-lg text-txt-primary mt-4">
          Parsing program...
        </Text>
        <Text className="font-body text-sm text-txt-secondary mt-2 text-center px-12">
          AI is reading your competition program and extracting every entry
        </Text>
      </SafeAreaView>
    );
  }

  if (mode === "text") {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
        <View className="flex-row items-center px-page-mobile pt-4 pb-4">
          <Pressable onPress={() => setMode("choose")} className="mr-3">
            <X color="#F4F4F5" size={24} strokeWidth={1.5} />
          </Pressable>
          <Text className="font-display text-xl text-txt-primary flex-1">
            Paste Program Text
          </Text>
        </View>

        <ScrollView className="flex-1 px-page-mobile" keyboardShouldPersistTaps="handled">
          <Text className="font-body text-sm text-txt-secondary mb-3">
            Copy the program text from a website, email, or PDF and paste it below.
          </Text>
          <TextInput
            value={textContent}
            onChangeText={setTextContent}
            placeholder="Paste competition program text here..."
            placeholderTextColor="#52525B"
            multiline
            textAlignVertical="top"
            className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border min-h-[300px] mb-6"
          />
          <Pressable onPress={handleTextSubmit}>
            <LinearGradient
              colors={[...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
            >
              <Text className="font-body-medium text-base text-txt-primary">
                Parse Program
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mode: choose
  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <X color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-xl text-txt-primary">
          Upload Program
        </Text>
      </View>

      <View className="flex-1 px-page-mobile justify-center">
        <Text className="font-body text-base text-txt-secondary text-center mb-8">
          How do you want to add the competition program?
        </Text>

        <View className="gap-4">
          <Pressable onPress={() => pickImage(true)}>
            <View className="bg-bg-card border border-border-subtle rounded-lg p-5 flex-row items-center">
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#4C1D95", alignItems: "center", justifyContent: "center" }}>
                <Camera color="#C084FC" size={24} strokeWidth={1.5} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-body-medium text-base text-txt-primary">Take Photo</Text>
                <Text className="font-body text-sm text-txt-secondary">Photograph the printed program</Text>
              </View>
            </View>
          </Pressable>

          <Pressable onPress={() => pickImage(false)}>
            <View className="bg-bg-card border border-border-subtle rounded-lg p-5 flex-row items-center">
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#4C1D95", alignItems: "center", justifyContent: "center" }}>
                <ImageIcon color="#C084FC" size={24} strokeWidth={1.5} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-body-medium text-base text-txt-primary">Choose Photo</Text>
                <Text className="font-body text-sm text-txt-secondary">Select from your photo library</Text>
              </View>
            </View>
          </Pressable>

          <Pressable onPress={() => setMode("text")}>
            <View className="bg-bg-card border border-border-subtle rounded-lg p-5 flex-row items-center">
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#4C1D95", alignItems: "center", justifyContent: "center" }}>
                <Type color="#C084FC" size={24} strokeWidth={1.5} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-body-medium text-base text-txt-primary">Paste Text</Text>
                <Text className="font-body text-sm text-txt-secondary">Copy and paste from a website or email</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
