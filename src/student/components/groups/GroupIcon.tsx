// Stable icon tile per group, shared by the groups list and group detail
// (same id → same colour).
import { GraduationCap } from "lucide-react";
import { IconTile, tintFor } from "../icons";

export const GroupIcon = ({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) => (
  <IconTile icon={GraduationCap} tint={tintFor(id)} size={size} />
);
