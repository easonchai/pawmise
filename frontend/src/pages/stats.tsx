import { NextPage } from "next";
import { useRouter } from "next/router";
import { useAppStore } from "@/store";
import Image from "next/image";
import { BottomNav } from "@/components/bottom-nav";

const StatsPage: NextPage = () => {
  const router = useRouter();
  const { realm } = useAppStore();

  const savingsPercentage = Math.round(
    (realm.savingsAchieved / realm.savingsGoal) * 100
  );

  // Mock data for savings trend (7 rows x 12 columns)
  const savingsTrend = Array(4)
    .fill(null)
    .map(() =>
      Array(16)
        .fill(null)
        .map(() => Math.random() > 0.3)
    );

  // Mock transaction history
  const transactions = [
    { date: "16/2/25", hash: "0x....smtfg", amount: 250 },
    { date: "16/2/25", hash: "0x....smtfg", amount: 250 },
    { date: "16/2/25", hash: "0x....smtfg", amount: 250 },
  ];

  return (
    <div className="min-h-screen w-full bg-[url('/backgrounds/bg-secondary.png')] bg-cover bg-center font-patrick-hand text-[#392E1F]">
      <div className="p-4 pb-24">
        {/* Wallet Balance Card */}
        <div className="bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-2">Wallet Balance</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-medium">$69,420.88</span>
            <span className="text-[#4CAF50] text-sm">+52% since last yr</span>
          </div>
        </div>

        {/* Savings Goal Progress Card */}
        <div className="mt-4 bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-4">Savings Goal Progress</h2>
          <div className="relative aspect-square w-48 mx-auto mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-medium">{savingsPercentage}%</span>
            </div>
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="#E2E8F0"
                strokeWidth="10%"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="#4CAF50"
                strokeWidth="10%"
                fill="none"
                strokeDasharray={`${savingsPercentage * 2.83} 283`}
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg">Current Total</p>
            <p className="text-xl">
              ${realm.savingsAchieved.toLocaleString()} out of
            </p>
            <p className="text-xl">
              ${realm.savingsGoal.toLocaleString()} goal
            </p>
          </div>
        </div>

        {/* Savings Trend Card */}
        <div className="mt-4 bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-4">Savings Trend</h2>
          <div className="flex flex-wrap gap-1">
            {savingsTrend.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((saved, j) =>
                  saved ? (
                    <Image
                      key={j}
                      src="/icons/heart_filled.png"
                      alt="Heart"
                      width={16}
                      height={16}
                    />
                  ) : (
                    <Image
                      key={j}
                      src="/icons/heart_empty.png"
                      alt="Heart"
                      width={16}
                      height={16}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History Card */}
        <div className="mt-4 bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-4">Transaction History</h2>
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-70">{tx.date}</p>
                  <p className="font-mono text-sm">{tx.hash}</p>
                </div>
                <span className="text-lg">${tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        currentPath={router.pathname}
        onChatClick={() => router.push("/app")}
      />
    </div>
  );
};

export default StatsPage;
