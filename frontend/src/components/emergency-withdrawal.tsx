import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmergencyDialog } from "@/components/ui/dialog";

export function EmergencyWithdrawal() {
  const [open, setOpen] = useState(false);

  const handleWithdraw = () => {
    // Handle withdrawal logic here
    console.log("Emergency withdrawal initiated");
    setOpen(false);
  };

  return (
    <EmergencyDialog
      open={open}
      onOpenChange={setOpen}
      title="Emergency Withdrawals"
      description="At any point in time, you may request for an emergency withdrawal. This will allow you to withdraw everything, no questions asked.

But in doing so, your guardian will fall. Your realm, everything you've built, will be sealed and archived forever. You will start again, with a new companion, a new dream.

Are you sure you're prepared for this?"
    >
      <Button variant="emergencyDestructive" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="emergency" onClick={handleWithdraw}>
        Yes, withdraw
      </Button>
    </EmergencyDialog>
  );
}
