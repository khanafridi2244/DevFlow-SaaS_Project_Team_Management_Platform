const AVATAR_COLORS = [
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
  "bg-avatar-6",
  "bg-avatar-7",
  "bg-avatar-8",
] as const;

const AVATAR_TEXT_COLORS = [
  "text-avatar-1",
  "text-avatar-2",
  "text-avatar-3",
  "text-avatar-4",
  "text-avatar-5",
  "text-avatar-6",
  "text-avatar-7",
  "text-avatar-8",
] as const;

// Simple deterministic hash: the same name always maps to the same
// color, every time, without needing to store a color choice anywhere
// in the database. This is intentionally not cryptographic — it just
// needs to spread names across the 8 buckets reasonably evenly.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(name: string) {
  const index = hashString(name) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[index], text: AVATAR_TEXT_COLORS[index] };
}