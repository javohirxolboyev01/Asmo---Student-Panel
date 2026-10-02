// src/student/components/SpaceAvatar.tsx
// Avatar value can be an image URL, a data/relative URL, or plain text
// (emoji / initials from the leaderboard). Missing → generated image.
import { getAvatarUrl, isImageUrl } from "@/lib/utils";

const isImageSrc = (v: string) => v.startsWith("data:") || v.startsWith("/") || isImageUrl(v);

export const SpaceAvatar = ({ avatar, name }: { avatar?: string | null; name: string }) => {
  if (avatar && !isImageSrc(avatar)) {
    return <span className="sp-display text-sm leading-none">{avatar}</span>;
  }
  return <img src={getAvatarUrl(avatar, name)} alt="" loading="lazy" />;
};
