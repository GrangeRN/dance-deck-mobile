// Brand tokens as JS constants — source of truth for non-Tailwind usage
// (gradients, programmatic colors, etc.)

export const colors = {
  bg: {
    primary: "#0D0D0F",
    card: "#1A1A1F",
    elevated: "#242429",
    input: "#27272A",
  },
  accent: {
    violet: "#C084FC",
    pink: "#F472B6",
    green: "#34D399",
    gold: "#F5E642",
    goldDeep: "#E8A020",
    amber: "#F59E0B",
  },
  text: {
    primary: "#F4F4F5",
    secondary: "#A1A1AA",
    muted: "#52525B",
    inverse: "#0D0D0F",
  },
  border: {
    subtle: "#27272A",
    default: "#3F3F46",
    strong: "#52525B",
  },
  status: {
    danger: "#F87171",
    success: "#34D399",
    warning: "#F59E0B",
    info: "#60A5FA",
  },
  nav: {
    active: "#C084FC",
    inactive: "#52525B",
  },
} as const;

export const gradients = {
  primary: ["#C084FC", "#F472B6"] as const,
  gold: ["#F5E642", "#E8A020"] as const,
  darkBg: ["#0D0D0F", "#1A1A1F"] as const,
};

export const dancerColors = [
  "#C084FC", "#F472B6", "#34D399", "#60A5FA",
  "#FB923C", "#F87171", "#A78BFA", "#4ADE80",
  "#FCD34D", "#67E8F9", "#F9A8D4", "#86EFAC",
] as const;

export const adjudicationTiers = {
  platinum: { color: "#C084FC", bg: "#4C1D95" },
  highGold: { color: "#F59E0B", bg: "#451A03" },
  gold: { color: "#FCD34D", bg: "#713F12" },
  highSilver: { color: "#94A3B8", bg: "#1E293B" },
  silver: { color: "#64748B", bg: "#0F172A" },
} as const;
