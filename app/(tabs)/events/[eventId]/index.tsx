import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";
import { CalendarDays } from "lucide-react-native";

export default function EventDetailScreen() {
  return (
    <ScreenPlaceholder
      icon={CalendarDays}
      title="Event Detail"
      subtitle="Info, schedule, packing list, notes"
    />
  );
}
