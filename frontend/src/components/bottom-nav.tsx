import Image from "next/image";
import { useRouter } from "next/router";
import { RadialFab } from "@/components/ui/radial-fab";
import { Camera, Edit, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDisconnectWallet } from "@mysten/dapp-kit";
import { useAppStore } from "@/store";
interface BottomNavProps {
  currentPath: string;
  onChatClick?: () => void;
}

export function BottomNav({ currentPath, onChatClick }: BottomNavProps) {
  const router = useRouter();
  const { mutate: disconnect } = useDisconnectWallet();
  const { logout } = useAppStore();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fabOptions = [
    {
      icon: <Camera className="h-5 w-5" />,
      label: "Take Photo",
      onClick: () =>
        console.log({
          title: "Camera",
          description: "Camera option clicked",
        }),
      color: "bg-blue-500 text-white",
    },
    {
      icon: <Edit className="h-5 w-5" />,
      label: "Edit",
      onClick: () =>
        console.log({
          title: "Edit",
          description: "Edit option clicked",
        }),
      color: "bg-green-500 text-white",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      onClick: () =>
        console.log({
          title: "Settings",
          description: "Settings option clicked",
        }),
      color: "bg-purple-500 text-white",
    },
  ];

  const handleLogout = () => {
    disconnect();
    logout();
    setSettingsOpen(false);
    router.push("/");
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-[#F6D998] py-4 px-6 border-t-2 border-[#392E1F]">
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer"
          onClick={onChatClick}
        >
          <Image
            src="/icons/chat.png"
            alt="Chat"
            width={24}
            height={24}
            className={currentPath === "/chat" ? "" : "opacity-50"}
          />
          <p className="text-[#392E1F] text-sm">Chat</p>
        </div>
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => router.push("/stats")}
        >
          <Image
            src="/icons/wallet.png"
            alt="Wallet"
            width={24}
            height={24}
            className={currentPath === "/stats" ? "" : "opacity-50"}
          />
          <p className="text-[#392E1F] text-sm">Stats</p>
        </div>

        <div className="flex-1 flex justify-center -mt-16">
          <RadialFab
            options={fabOptions}
            icon={
              <Image src="/icons/treat.png" alt="Bone" width={32} height={32} />
            }
            buttonClassName="bg-[#392E1F] border-0"
          />
        </div>

        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setEmergencyOpen(true)}
        >
          <Image
            src="/icons/siren.png"
            alt="Emergency"
            width={24}
            height={24}
            className={currentPath === "/emergency" ? "" : "opacity-50"}
          />
          <p className="text-[#392E1F] text-sm">Emergency</p>
        </div>
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setSettingsOpen(true)}
        >
          <Image
            src="/icons/settings.png"
            alt="Settings"
            width={24}
            height={24}
            className={currentPath === "/settings" ? "" : "opacity-50"}
          />
          <p className="text-[#392E1F] text-sm">Settings</p>
        </div>
      </nav>

      {/* Dialogs */}
      <Dialog
        open={emergencyOpen}
        onOpenChange={setEmergencyOpen}
        title="Emergency Withdrawals"
        description="At any point in time, you may request for an emergency withdrawal. This will allow you to withdraw everything, no questions asked.

But in doing so, your guardian will fall. Your realm, everything you've built, will be sealed and archived forever. You will start again, with a new companion, a new dream.

Are you sure you're prepared for this?"
      >
        <Button
          variant="emergencyDestructive"
          className="flex-1"
          onClick={() => setEmergencyOpen(false)}
        >
          Cancel
        </Button>
        <Button
          variant="emergency"
          className="flex-1"
          onClick={() => {
            console.log("Emergency withdrawal initiated");
            setEmergencyOpen(false);
          }}
        >
          Yes, withdraw
        </Button>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Settings"
        description="Work in progress..."
      >
        <Button
          variant="emergencyDestructive"
          className="flex-1"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </Dialog>
    </>
  );
}
