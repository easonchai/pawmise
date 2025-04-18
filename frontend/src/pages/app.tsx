import { NextPage } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Head from "next/head";

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

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen w-full bg-[url('/bg-primary.png')] bg-cover bg-center font-patrick-hand">
        <div className="flex flex-col items-center p-4">
          {/* Realm Status */}
          <div className="flex items-center gap-4 rounded-full bg-white/90 px-4 py-2">
            <div className="flex items-center gap-2">
              <Image
                src="/realm-icon.png"
                alt="Realm Icon"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="text-lg">Realm Status</p>
                <p className="text-xl font-medium">{realmStatus.status}</p>
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
                  width={24}
                  height={24}
                />
              ))}
            </div>
          </div>

          {/* Savings Goal */}
          <div className="mt-4 w-full max-w-md rounded-lg bg-white/90 p-4">
            <div className="flex justify-between">
              <p className="text-lg">Savings Goal</p>
              <p className="text-lg">
                ${realmStatus.savingsGoal.toLocaleString()}
              </p>
            </div>
            <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${
                    (realmStatus.savingsAchieved / realmStatus.savingsGoal) *
                    100
                  }%`,
                }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {Math.round(
                (realmStatus.savingsAchieved / realmStatus.savingsGoal) * 100
              )}
              % of goal achieved
            </p>
          </div>

          {/* Pet Display */}
          <div className="relative mt-8 flex-1">
            <Image
              src="/luna.png"
              alt="Luna"
              width={200}
              height={200}
              className="mx-auto"
            />
            <p className="mt-2 text-center text-2xl">Luna</p>
          </div>

          {/* Camera Button */}
          <div className="absolute right-4 top-32">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/90"
            >
              <Image src="/camera.png" alt="Camera" width={24} height={24} />
            </Button>
          </div>

          {/* Give Treats Button */}
          <div className="mt-4">
            <Button className="text-lg">Give Treats</Button>
          </div>

          {/* Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-white p-4">
            <Button variant="ghost" size="icon">
              <Image src="/chat.png" alt="Chat" width={24} height={24} />
            </Button>
            <Button variant="ghost" size="icon">
              <Image src="/wallet.png" alt="Wallet" width={24} height={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black"
            >
              <Image src="/bone.png" alt="Bone" width={24} height={24} />
            </Button>
            <Button variant="ghost" size="icon">
              <Image
                src="/emergency.png"
                alt="Emergency"
                width={24}
                height={24}
              />
            </Button>
            <Button variant="ghost" size="icon">
              <Image
                src="/settings.png"
                alt="Settings"
                width={24}
                height={24}
              />
            </Button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AppPage;
