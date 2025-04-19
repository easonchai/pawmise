import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 bg-[#FFE9B9] backdrop-blur-sm p-4 border-t border-[#392E1F]/20">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 resize-none rounded-xl border-2 border-[#392E1F] bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#392E1F] min-h-[44px] max-h-[120px]"
        rows={1}
        disabled={disabled}
      />
      <Button
        size="icon"
        className="h-11 w-11 rounded-xl bg-[#F1C042] hover:bg-[#F1C042]/80"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
      >
        <Image src="/icons/send.svg" alt="Send" width={20} height={20} />
      </Button>
    </div>
  );
}
