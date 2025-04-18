import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmergencyDialog } from "@/components/ui/emergency-dialog";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logging out...");
    setOpen(false);
  };

  return (
    <EmergencyDialog
      open={open}
      onOpenChange={setOpen}
      title="Settings"
      description="Work in progress..."
    >
      <Button variant="emergencyDestructive" onClick={handleLogout}>
        Log Out
      </Button>
    </EmergencyDialog>
  );
}
