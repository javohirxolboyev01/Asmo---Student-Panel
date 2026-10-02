// Stable "ship" emoji per group, shared by the groups list and group detail.
const GROUP_EMOJI = ["🛰", "🪐", "🚀", "🌙", "☄️", "🛸", "🌍", "⭐"];

export const groupEmoji = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GROUP_EMOJI[Math.abs(h) % GROUP_EMOJI.length];
};
