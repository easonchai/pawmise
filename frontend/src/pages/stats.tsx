"use client";

import { NextPage } from "next";
import { useRouter } from "next/router";
import { useAppStore } from "@/store";
import Image from "next/image";
import { BottomNav } from "@/components/bottom-nav";
import { PieChart, Pie, Cell, Label } from "recharts";

const StatsPage: NextPage = () => {
  const router = useRouter();
  const { realm } = useAppStore();

  const savingsPercentage = Math.round(
    (realm.savingsAchieved / realm.savingsGoal) * 100
  );

  const chartData = [
    {
      name: "saved",
      value: realm.savingsAchieved,
      color: "#3E9615",
    },
    {
      name: "remaining",
      value: realm.savingsGoal - realm.savingsAchieved,
      color: "#BE9554",
    },
  ];

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
    { date: "19/4/25", hash: "0x....a4e1", amount: 50 },
    { date: "17/4/25", hash: "0x....tl5e", amount: 300 },
    { date: "16/4/25", hash: "0x....7r33", amount: 150 },
  ];

  return (
    <div className="min-h-screen w-full bg-[url('/backgrounds/bg-secondary.png')] bg-cover bg-center font-patrick-hand text-[#392E1F]">
      <div className="p-4 pb-24">
        {/* Wallet Balance Card */}
        <div className="bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-2">Wallet Balance</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-medium">
              ${realm.savingsAchieved.toLocaleString()}
            </span>
            {realm.savingsAchieved > 0 && (
              <span className="text-[#4CAF50] text-sm">+52% since last yr</span>
            )}
          </div>
        </div>

        {/* Savings Goal Progress Card */}
        <div className="mt-4 bg-[#F6D998] rounded-lg p-4 shadow-md border-2 border-[#392E1F]">
          <h2 className="text-2xl mb-4">Savings Goal Progress</h2>
          <div className="relative aspect-square w-48 mx-auto mb-4">
            <PieChart width={200} height={200}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="#392E1F"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  value={`${savingsPercentage}%`}
                  position="center"
                  className="text-3xl font-bold fill-[#392E1F]"
                />
              </Pie>
            </PieChart>
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
