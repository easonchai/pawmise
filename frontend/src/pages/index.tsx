import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-patrick-hand text-[#282424] bg-[url('/backgrounds/bg-primary.png')] bg-cover bg-center min-h-screen py-16 justify-between flex flex-col">
      <div className="flex flex-col w-full">
        <h1 className="text-6xl text-center">Pawmise</h1>
        <p className="text-xl mt-3 text-center">
          Your journey towards wiser wealth
        </p>
      </div>
      <div className="flex w-full items-center justify-center">
        <Link href="/app">
          <Button>
            <p className="text-2xl">Get Started</p>
          </Button>
        </Link>
      </div>
    </div>
  );
}
