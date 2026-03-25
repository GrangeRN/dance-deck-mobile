import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";
import { CalendarDays } from "lucide-react-native";

export default function EventsScreen() {
  return (
    <ScreenPlaceholder
      icon={CalendarDays}
      title="Events"
      subtitle="Your competitions and events"
    />
  );
}
