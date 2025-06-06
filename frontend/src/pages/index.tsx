"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useAppStore } from "@/store";
import { apiService } from "../utils/apiService";

export default function Home() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { setWalletAddress, isOnboarded, setIsOnboarded } = useAppStore();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (account) {
        const address = account.address;
        setWalletAddress(address);

        try {
          const response = await apiService.user.getUser(address);
          if (response.data) {
            // User exists, mark as onboarded
            setIsOnboarded(true);
            router.push("/app");
          } else {
            // User doesn't exist, go to onboarding
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Error checking user:", error);
          // If API error, fallback to local state
          if (isOnboarded) {
            router.push("/app");
          } else {
            router.push("/onboarding");
          }
        }
      }
    };

    checkUserAndRedirect();
  }, [account, router, setWalletAddress, isOnboarded, setIsOnboarded]);

  return (
    <div className="font-patrick-hand text-[#282424] bg-[url('/backgrounds/bg-primary.png')] bg-cover bg-center min-h-screen py-16 justify-between flex flex-col">
      <div className="flex flex-col w-full">
        <h1 className="text-6xl text-center">Pawmise</h1>
        <p className="text-xl mt-3 text-center">
          Your journey towards wiser wealth
        </p>
      </div>
      <div className="flex w-full items-center justify-center">
        <ConnectButton className="!text-2xl !bg-[#F6D998] hover:!bg-[#F6D998]/90 !text-[#392E1F] !border-2 !border-[#392E1F] !rounded-lg !px-4 !py-2" />
      </div>
    </div>
  );
}
