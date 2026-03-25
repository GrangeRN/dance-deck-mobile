import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";
import { MessageCircle } from "lucide-react-native";

export default function ChatScreen() {
  return (
    <ScreenPlaceholder
      icon={MessageCircle}
      title="Chat"
      subtitle="Group channels and conversations"
    />
  );
}
