import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  // Format value for display (add commas)
  const formatValue = (val: string) => {
    const number = parseFloat(val.replace(/[^0-9.]/g, ""));
    if (isNaN(number)) return "";
    return number.toLocaleString("en-US", {});
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    const number = parseFloat(rawValue);

    if (rawValue === "" || isNaN(number)) {
      onChange("");
      return;
    }

    onChange(rawValue);
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-xl text-[#392e1f]">$</span>
      </div>
      <Input
        {...props}
        value={formatValue(value)}
        onChange={handleChange}
        className={cn("pl-7 pr-3", className)}
      />
    </div>
  );
}
