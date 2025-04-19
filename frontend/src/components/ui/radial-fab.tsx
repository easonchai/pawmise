import type React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { TreatDialog } from "./treat-dialog";

export type TreatOption = {
  amount: number;
  onClick: (amount: number) => void;
};

interface RadialFabProps {
  options: TreatOption[];
  className?: string;
  buttonClassName?: string;
  optionClassName?: string;
  radius?: number;
}

export function RadialFab({
  options = [],
  className,
  buttonClassName,
  optionClassName,
  radius = 100,
}: RadialFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<TreatOption | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleOptionClick = (option: TreatOption) => {
    setSelectedOption(option);
    setIsDialogOpen(true);
    setIsOpen(false);
  };

  const handleDialogConfirm = (amount: number) => {
    if (selectedOption) {
      selectedOption.onClick(amount);
    }
  };

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
              const x = -Math.cos(angle) * radius;
              const y = -Math.sin(angle) * radius;

              return (
                <motion.button
                  key={visibleOptions.length - 1 - i}
                  className={cn(
                    "absolute flex h-16 w-16 items-center justify-center rounded-full shadow-lg bg-[#392E1F] text-primary-foreground",
                    optionClassName
                  )}
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
                  onClick={() => handleOptionClick(option)}
                  aria-label={`${option.amount} treats`}
                  title={`${option.amount} treats`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">{option.amount}</span>
                    <div className="relative w-6 h-6">
                      <Image
                        src="/icons/treat.png"
                        alt="Treat"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
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
          <Image
            src="/icons/treat.png"
            alt="Treat"
            fill
            className="object-contain p-2"
          />
        </motion.button>
      </div>

      {/* Treat Dialog */}
      {selectedOption && (
        <TreatDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialAmount={selectedOption.amount}
          onConfirm={handleDialogConfirm}
        />
      )}
    </div>
  );
}
