import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  isUser?: boolean;
  senderName?: string;
}

export function MessageBubble({
  message,
  isUser = false,
  senderName,
}: MessageBubbleProps) {
  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
          isUser
            ? "bg-[#392E1F] text-white rounded-br-none"
            : "bg-[#F6D998] text-[#392E1F] rounded-bl-none"
        )}
      >
        {!isUser && senderName && (
          <p className="font-semibold mb-1">{senderName}:</p>
        )}
        <p className="break-words">{message}</p>
      </div>
    </div>
  );
}
