import { NextPage } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

const SharePage: NextPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-[url('/backgrounds/bg-primary.png')] bg-cover bg-center font-patrick-hand text-[#392E1F] relative">
      <div className="flex flex-col items-center justify-between min-h-screen p-8">
        {/* Top Text */}
        <div className="text-center space-y-2 mt-8">
          <p className="text-2xl">I have saved over</p>
          <p className="text-4xl font-medium">
            <span className="text-[#4CAF50]">85%</span> of my savings goal!
          </p>
        </div>

        {/* Pet Display with Environment */}
        <div className="relative w-full max-w-md aspect-[4/3] -mt-8">
          <div className="absolute inset-0">
            <Image
              src="/realms/tiers/tier-5.png"
              alt="Island Background"
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center transform translate-y-6 -translate-x-6">
            <div className="relative w-24 h-24">
              <Image
                src="/dogs/pom.png"
                alt="Luna"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center text-xl mb-4">
          Look how happy Luna is in her
          <br />
          flourishing home!
        </div>

        {/* Back Button */}
        <Button
          variant="emergency"
          onClick={() => router.push("/app")}
          className="mb-8"
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default SharePage;
