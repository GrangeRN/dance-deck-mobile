import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";
import { Home } from "lucide-react-native";

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      icon={Home}
      title="DanceDeck"
      subtitle="Your competition day command center"
    />
  );
}
