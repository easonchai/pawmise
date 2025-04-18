import type React from "react";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FabOption = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
};

interface RadialFabProps {
  options: FabOption[];
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  optionClassName?: string;
  radius?: number;
}

export function RadialFab({
  options = [],
  icon = <Plus className="h-6 w-6" />,
  className,
  buttonClassName,
  optionClassName,
  radius = 100,
}: RadialFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  // Only use up to 3 options
  const visibleOptions = options.slice(0, 3);

  return (
    <div ref={containerRef} className={cn("inline-block", className)}>
      <div className="relative">
        <AnimatePresence>
          {isOpen &&
            visibleOptions.map((option, i) => {
              // Calculate position in a semi-circle
              const angle = (Math.PI / (visibleOptions.length + 1)) * (i + 1);
              const x = Math.cos(angle) * radius;
              const y = -Math.sin(angle) * radius;

              return (
                <motion.button
                  key={i}
                  className={cn(
                    "absolute flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
                    option.color || "bg-primary text-primary-foreground",
                    optionClassName
                  )}
                  style={{
                    // Position at the center of the main button
                    bottom: "8px", // Half of main button height
                    right: "8px", // Half of main button width
                  }}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{
                    opacity: 1,
                    y,
                    x,
                    transition: { delay: i * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: 0,
                    x: 0,
                    transition: { duration: 0.2 },
                  }}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  aria-label={option.label}
                  title={option.label}
                >
                  {option.icon}
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
            buttonClassName
          )}
          onClick={toggleOpen}
          animate={isOpen ? { rotate: 45 } : { rotate: 0 }}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {icon}
        </motion.button>
      </div>
    </div>
  );
}
