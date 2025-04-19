import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface TreatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount: number;
  onConfirm: (amount: number) => void;
}

export function TreatDialog({
  isOpen,
  onClose,
  initialAmount,
  onConfirm,
}: TreatDialogProps) {
  const [amount, setAmount] = useState(initialAmount.toString());

  const handleConfirm = () => {
    const parsedAmount = parseInt(amount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onConfirm(parsedAmount);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Treats?</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-2xl font-bold bg-white/80 focus:ring-2 focus:ring-[#392E1F] border-2 border-[#392E1F] rounded-lg p-2"
          />
          <div className="relative w-8 h-8">
            <Image
              src="/icons/treat.png"
              alt="Treat"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex flex-row gap-x-2">
            <Button variant="emergency" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="emergencyDestructive"
              className="flex-1"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
