import { getAvatarColor } from "@/lib/avatarColor";
import { cn } from "@/lib/utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md";
}

export function Avatar({ firstName, lastName, size = "sm" }: AvatarProps) {
  const { bg, text } = getAvatarColor(`${firstName} ${lastName}`);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-mono",
        bg + "/20",
        text,
        size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-xs"
      )}
    >
      {firstName[0]}
      {lastName[0]}
    </div>
  );
}