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
import {
  useCurrentAccount,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useAppStore } from "@/store";
import { Transaction } from "@mysten/sui/transactions";
import { apiService } from "@/utils/apiService";

interface BottomNavProps {
  currentPath: string;
  onChatClick?: () => void;
}
const MOCK_TOKEN_TYPE =
  "0x3ba99780cae8374577a0ad2e128bdb5b6cda3574439fee8288295e0719127084::mock_token::MOCK_TOKEN";

// async function getCoinsOfType(
//   client: SuiClient,
//   coinType: string,
//   address: string,
// ) {
//   // Query for all coins of the specified type owned by this address
//   const coinsResponse = await client.getCoins({
//     owner: address,
//     coinType,
//   });
//
//   return coinsResponse.data;
// }
//
// async function getTokenBalance(
//   client: SuiClient,
//   coinType: string,
//   address: string,
// ) {
//   const coins = await getCoinsOfType(client, coinType, address);
//
//   let totalBalance = 0;
//   for (const coin of coins) {
//     totalBalance += Number(coin.balance);
//   }
//
//   return totalBalance;
// }

export function BottomNav({ currentPath, onChatClick }: BottomNavProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { logout } = useAppStore();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { selectedDog } = useAppStore();
  const suiClient = useSuiClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showEffects: true,
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
        },
      }),
  });

  // // TODO: UPDATE BALANCE
  // Handle sending tokens to guardian
  const handleGivingTreats = async (amount: number) => {
    if (isProcessing) {
      return;
    }

    if (!selectedDog?.walletAddress) {
      console.error("No guardian wallet address found");
      return;
    }

    if (!currentAccount?.address) {
      console.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new transaction
      const tx = new Transaction();

      // Convert amount to MIST (9 decimals for MOCK token)
      const mockAmountToSend = BigInt(amount * 1e9);
      // Send 0.5 SUI per transaction
      const suiAmountToSend = BigInt(5 * 1e8);

      // Get MOCK tokens from wallet
      const mockCoinsResponse = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: MOCK_TOKEN_TYPE,
      });

      const mockCoins = mockCoinsResponse.data;

      if (!mockCoins || mockCoins.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Find a MOCK token with sufficient balance
      const suitableMockCoin = mockCoins.find(
        (coin) => BigInt(coin.balance) >= mockAmountToSend,
      );

      if (suitableMockCoin) {
        // If we found a single coin with enough balance, use it directly
        const [splitToken] = tx.splitCoins(
          tx.object(suitableMockCoin.coinObjectId),
          [mockAmountToSend],
        );
        tx.transferObjects([splitToken], selectedDog.walletAddress);
      } else {
        // If no single coin has enough, merge coins until we have enough
        let totalBalance = BigInt(0);
        const tokensToUse = [];

        // Find coins to merge until we have enough balance
        for (const coin of mockCoins) {
          totalBalance += BigInt(coin.balance);
          tokensToUse.push(coin.coinObjectId);

          if (totalBalance >= mockAmountToSend) break;
        }

        if (totalBalance < mockAmountToSend) {
          setIsProcessing(false);
          return;
        }

        // Merge coins and split the amount
        const primaryToken = tx.object(tokensToUse[0]);
        if (tokensToUse.length > 1) {
          const otherTokens = tokensToUse.slice(1).map((id) => tx.object(id));
          tx.mergeCoins(primaryToken, otherTokens);
        }

        const [splitToken] = tx.splitCoins(primaryToken, [mockAmountToSend]);
        tx.transferObjects([splitToken], selectedDog.walletAddress);
      }

      // Add SUI transfer - we'll use the gas coin directly for simplicity
      const [suiSplitCoin] = tx.splitCoins(tx.gas, [suiAmountToSend]);
      tx.transferObjects([suiSplitCoin], selectedDog.walletAddress);

      // Execute the transaction
      const result = await signAndExecute({
        transaction: tx,
      });
      console.log("RESULT")
      console.dir(result, {depth: 7})
      if (result.effects?.status.status === "success" && selectedDog.id) {
        // TODO: Update balance
        await apiService.pet.updateBalance({
          id: selectedDog.id,
          amount: mockAmountToSend.toString(),
        });
      }

      console.log("Transaction successful!", result.digest);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmergencyWithdrawal = async () => {
    console.log("Emergency withdrawal initiated");

    if (currentAccount) {
      try {
        const response = await apiService.ai.emergencyWithdrawal(
          currentAccount.address
        );
        console.log("Emergency withdrawal result:", response);
      } catch (error) {
        console.error("Emergency withdrawal failed:", error);
      }
    } else {
      console.error("No wallet connected for emergency withdrawal");
    }

    setEmergencyOpen(false);
  };

  const fabOptions = [
    {
      amount: 1,
      onClick: (amount: number) => handleGivingTreats(amount),
    },
    {
      amount: 5,
      onClick: (amount: number) => handleGivingTreats(amount),
    },
    {
      amount: 50,
      onClick: (amount: number) => handleGivingTreats(amount),
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
                onClick={handleEmergencyWithdrawal}
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
