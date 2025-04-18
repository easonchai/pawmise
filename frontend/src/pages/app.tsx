import { NextPage } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RadialFab } from "@/components/ui/radial-fab";
import { Camera, Edit, Settings } from "lucide-react";
import { EmergencyDialog } from "@/components/ui/emergency-dialog";
import { useState } from "react";

interface RealmStatus {
  status: string;
  hearts: number;
  maxHearts: number;
  savingsGoal: number;
  savingsAchieved: number;
}

const AppPage: NextPage = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const realmStatus: RealmStatus = {
    status: "Flourishing",
    hearts: 2,
    maxHearts: 3,
    savingsGoal: 25000,
    savingsAchieved: 20000,
  };

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

  return (
    <>
      <div className="min-h-screen w-full bg-[url('/backgrounds/bg-primary.png')] bg-cover bg-center font-patrick-hand text-[#392E1F] relative">
        <div className="flex flex-col p-4">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {/* Realm Status - Left */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src="/icons/realm.png"
                  alt="Realm Icon"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-base leading-tight">Realm Status</p>
                <p className="text-lg font-medium leading-tight">
                  {realmStatus.status}
                </p>
              </div>
            </div>

            {/* Hearts - Right */}
            <div className="flex gap-1 h-full items-center justify-center">
              {Array.from({ length: realmStatus.maxHearts }).map((_, i) => (
                <Image
                  key={i}
                  src={
                    i < realmStatus.hearts
                      ? "/icons/heart_filled.png"
                      : "/icons/heart_empty.png"
                  }
                  alt="Heart"
                  width={20}
                  height={20}
                />
              ))}
            </div>
          </div>

          {/* Savings Goal */}
          <div className="mt-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-1">
              <p className="text-base">Savings Goal</p>
              <p className="text-base">
                ${realmStatus.savingsGoal.toLocaleString()}
              </p>
            </div>
            <div className="h-3 w-full rounded-full bg-[#392E1F]/20 overflow-hidden border-2 border-[#392E1F]">
              <div
                className="h-full bg-[#4CAF50] transition-all"
                style={{
                  width: `${
                    (realmStatus.savingsAchieved / realmStatus.savingsGoal) *
                    100
                  }%`,
                }}
              />
            </div>
            <p className="text-sm mt-1 text-center">
              {Math.round(
                (realmStatus.savingsAchieved / realmStatus.savingsGoal) * 100
              )}
              % of goal achieved
            </p>
          </div>

          {/* Camera Button */}
          <div className="absolute right-6 top-48">
            <Image
              src="/icons/camera.png"
              alt="Camera"
              width={32}
              height={32}
            />
          </div>

          {/* Pet Display */}
          <div className="flex-1 flex flex-col items-center justify-end transform translate-y-56">
            <p className="my-2 text-2xl">Luna</p>
            <div className="relative w-48 h-48">
              <Image
                src="/dogs/pom.png"
                alt="Luna"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Give Treats Button */}
          {/* <div className="flex justify-center mb-8 fixed bottom-24 left-0 right-0">
            <Button className="text-lg px-8 py-2 bg-[#F6D998] hover:bg-[#F6D998]/90 text-[#392E1F] border-2 border-[#392E1F]">
              Give Treats
            </Button>
          </div> */}

          {/* Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-[#F6D998] py-4 px-6 border-t-2 border-[#392E1F]">
            <div className="flex-1 flex flex-col items-center justify-center">
              <Image
                src="/icons/chat.png"
                alt="Chat"
                width={24}
                height={24}
                className="opacity-50"
              />
              <p className="text-[#392E1F] text-sm">Chat</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <Image
                src="/icons/wallet.png"
                alt="Wallet"
                width={24}
                height={24}
                className="opacity-50"
              />
              <p className="text-[#392E1F] text-sm">Stats</p>
            </div>

            <div className="flex-1 flex justify-center -mt-16">
              <RadialFab
                options={fabOptions}
                icon={
                  <Image
                    src="/icons/treat.png"
                    alt="Bone"
                    width={32}
                    height={32}
                  />
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
                className="opacity-50"
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
                className="opacity-50"
              />
              <p className="text-[#392E1F] text-sm">Settings</p>
            </div>
          </nav>
        </div>

        {/* Dialogs */}
        <EmergencyDialog
          open={emergencyOpen}
          onOpenChange={setEmergencyOpen}
          title="Emergency Withdrawals"
          description="At any point in time, you may request for an emergency withdrawal. This will allow you to withdraw everything, no questions asked.

But in doing so, your guardian will fall. Your realm, everything you've built, will be sealed and archived forever. You will start again, with a new companion, a new dream.

Are you sure you're prepared for this?"
        >
          <Button
            variant="emergencyDestructive"
            onClick={() => setEmergencyOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="emergency"
            onClick={() => {
              console.log("Emergency withdrawal initiated");
              setEmergencyOpen(false);
            }}
          >
            Yes, withdraw
          </Button>
        </EmergencyDialog>

        <EmergencyDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          title="Settings"
          description="Work in progress..."
        >
          <Button
            variant="emergencyDestructive"
            onClick={() => {
              console.log("Logging out...");
              setSettingsOpen(false);
            }}
          >
            Log Out
          </Button>
        </EmergencyDialog>
      </div>
    </>
  );
};

export default AppPage;
