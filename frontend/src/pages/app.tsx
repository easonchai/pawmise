import { NextPage } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RadialFab } from "@/components/ui/radial-fab";
import { Camera, Edit, Settings } from "lucide-react";

interface RealmStatus {
  status: string;
  hearts: number;
  maxHearts: number;
  savingsGoal: number;
  savingsAchieved: number;
}

const AppPage: NextPage = () => {
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
        <div className="flex flex-col items-center p-4">
          {/* Realm Status */}
          <div className="flex items-center gap-4 rounded-full bg-white/80 px-4 py-2 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src="/realms/land.png"
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
            <div className="flex gap-1">
              {Array.from({ length: realmStatus.maxHearts }).map((_, i) => (
                <Image
                  key={i}
                  src={
                    i < realmStatus.hearts
                      ? "/heart-filled.png"
                      : "/heart-empty.png"
                  }
                  alt="Heart"
                  width={20}
                  height={20}
                />
              ))}
            </div>
          </div>

          {/* Savings Goal */}
          <div className="mt-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-1">
              <p className="text-base">Savings Goal</p>
              <p className="text-base">
                ${realmStatus.savingsGoal.toLocaleString()}
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-[#392E1F]/20 overflow-hidden">
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
            <p className="text-sm mt-1">
              {Math.round(
                (realmStatus.savingsAchieved / realmStatus.savingsGoal) * 100
              )}
              % of goal achieved
            </p>
          </div>

          {/* Camera Button */}
          <div className="absolute right-4 top-24">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 shadow-md w-10 h-10 p-0"
            >
              <Image
                src="/icons/camera.png"
                alt="Camera"
                width={20}
                height={20}
              />
            </Button>
          </div>

          {/* Pet Display */}
          <div className="flex-1 flex flex-col items-center justify-center mt-8">
            <div className="relative w-48 h-48">
              <Image
                src="/dogs/pom.png"
                alt="Luna"
                fill
                className="object-contain"
              />
            </div>
            <p className="mt-2 text-2xl">Luna</p>
          </div>

          {/* Give Treats Button */}
          <div className="mt-4 mb-20">
            <Button className="text-lg px-8 py-2 bg-[#F6D998] hover:bg-[#F6D998]/90 text-[#392E1F] border-2 border-[#392E1F]">
              Give Treats
            </Button>
          </div>

          {/* Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-[#F6D998] py-4 px-6 border-t border-[#392E1F]/10">
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

            <div className="flex-1 flex flex-col items-center justify-center">
              <Image
                src="/icons/siren.png"
                alt="Emergency"
                width={24}
                height={24}
                className="opacity-50"
              />
              <p className="text-[#392E1F] text-sm">Emergency</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
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
      </div>
    </>
  );
};

export default AppPage;
