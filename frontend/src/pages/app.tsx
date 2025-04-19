import { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAppStore } from "@/store";
import { BottomNav } from "@/components/bottom-nav";

const AppPage: NextPage = () => {
  const router = useRouter();
  const { realm, selectedDog } = useAppStore();

  const savingsPercentage = Math.round(
    (realm.savingsAchieved / realm.savingsGoal) * 100
  );

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
                  src={`/icons/realm.png`}
                  alt="Realm Icon"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-base leading-tight">Realm Status</p>
                <p className="text-lg font-medium leading-tight">
                  {realm.status}
                </p>
              </div>
            </div>

            {/* Hearts - Right */}
            <div className="flex gap-1 h-full items-center justify-center">
              {Array.from({ length: realm.maxHearts }).map((_, i) => (
                <Image
                  key={i}
                  src={
                    i < realm.hearts
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
              <p className="text-base">${realm.savingsGoal.toLocaleString()}</p>
            </div>
            <div className="h-3 w-full rounded-full bg-[#392E1F]/20 overflow-hidden border-2 border-[#392E1F]">
              <div
                className="h-full bg-[#4CAF50] transition-all"
                style={{
                  width: `${savingsPercentage}%`,
                }}
              />
            </div>
            <p className="text-sm mt-1 text-center">
              {savingsPercentage}% of goal achieved
            </p>
          </div>

          {/* Camera Button */}
          <div
            className="absolute right-6 top-48 cursor-pointer"
            onClick={() => router.push("/share")}
          >
            <Image
              src="/icons/camera.png"
              alt="Camera"
              width={32}
              height={32}
            />
          </div>

          {/* Pet Display */}
          <div className="flex-1 flex flex-col items-center justify-end transform translate-y-56">
            <p className="my-2 text-2xl">{selectedDog?.name || "Luna"}</p>
            <div className="relative w-48 h-48">
              <Image
                src={selectedDog?.image || "/dogs/pom.png"}
                alt={selectedDog?.name || "Guardian Angel"}
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          <BottomNav currentPath={router.pathname} />
        </div>
      </div>
    </>
  );
};

export default AppPage;
