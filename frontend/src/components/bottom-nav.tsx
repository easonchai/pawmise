"use client";

import Image from "next/image";
import { useRouter } from "next/router";
import { RadialFab } from "@/components/ui/radial-fab";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
      amount: 1,
      onClick: (amount: number) => {
        console.log(`Giving ${amount} treats`);
      },
    },
    {
      amount: 5,
      onClick: (amount: number) => {
        console.log(`Giving ${amount} treats`);
      },
    },
    {
      amount: 50,
      onClick: (amount: number) => {
        console.log(`Giving ${amount} treats`);
      },
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

      {/* Emergency Dialog */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Withdrawals</DialogTitle>
            <DialogDescription className="text-left">
              At any point in time, you may request for an emergency withdrawal.
              This will allow you to withdraw everything, no questions asked.
              <br />
              But in doing so, your guardian will fall. Your realm, everything
              you&apos;ve built, will be sealed and archived forever. You will
              start again, with a new companion, a new dream.
              <br />
              <br />
              <b>Are you sure you&apos;re prepared for this?</b>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex flex-row gap-x-2 mt-4">
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className="my-8">
              Work in progress...
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="emergencyDestructive"
              className="flex-1"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
