import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";
import { User } from "lucide-react-native";

export default function AccountScreen() {
  return (
    <ScreenPlaceholder
      icon={User}
      title="Account"
      subtitle="Dancer profiles, settings, subscription"
    />
  );
}
