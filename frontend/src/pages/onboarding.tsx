import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useAppStore } from "@/store";
import { apiService } from "../utils/apiService";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface FormData {
  savingsGoal: string;
  petName: string;
  userName: string;
}

const DOGS = [
  {
    breed: "pom",
    name: "Luna",
    image: "/dogs/pom.png",
  },
  {
    breed: "mongrel",
    name: "Fanshu",
    image: "/dogs/mongrel.png",
  },
  {
    breed: "korat",
    name: "Lulu",
    image: "/dogs/korat.png",
  },
  {
    breed: "chihuahua",
    name: "Cheeky",
    image: "/dogs/chihuahua.png",
  },
  {
    breed: "corgi",
    name: "Hazel",
    image: "/dogs/corgi.png",
  },
  {
    breed: "goldie",
    name: "Lucky",
    image: "/dogs/goldie.png",
  },
  {
    breed: "shihtzu",
    name: "Nikko",
    image: "/dogs/shihtzu.png",
  },
];

const getTierFromAmount = (amount: number): number => {
  if (amount < 100) return 1;
  if (amount < 500) return 2;
  if (amount < 1000) return 3;
  if (amount < 5000) return 4;
  if (amount < 10000) return 5;
  return 6;
};

export default function Onboarding() {
  const router = useRouter();
  const {
    setSelectedDog,
    setSavingsGoal,
    setUserName,
    setIsOnboarded,
    updateRealmStatus,
  } = useAppStore();

  const account = useCurrentAccount();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    savingsGoal: "",
    petName: "",
    userName: "",
  });
  const [currentTier, setCurrentTier] = useState(1);
  const [selectedDogIndex, setSelectedDogIndex] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavingsGoalChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      savingsGoal: value,
    }));

    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!isNaN(numericValue)) {
      setCurrentTier(getTierFromAmount(numericValue));
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (step === 1 && !formData.savingsGoal) {
      alert("Please enter your savings goal");
      return;
    }
    if (step === 2 && !formData.petName) {
      alert("Please give your guardian angel a name");
      return;
    }
    if (step === 3 && !formData.userName) {
      alert("Please enter your name");
      return;
    }

    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      // Save all data to store
      const numericSavingsGoal = parseFloat(
        formData.savingsGoal.replace(/[^0-9.]/g, "")
      );

      // Update selected dog
      setSelectedDog({
        breed: DOGS[selectedDogIndex].breed,
        name: formData.petName || DOGS[selectedDogIndex].name,
        image: DOGS[selectedDogIndex].image,
      });

      // Update savings goal
      setSavingsGoal(formData.savingsGoal);

      // Update user name
      setUserName(formData.userName);

      // Update realm status
      updateRealmStatus({
        tier: getTierFromAmount(numericSavingsGoal),
        savingsGoal: numericSavingsGoal,
        savingsAchieved: 0, // Start with 0 savings
        hearts: 3, // Default starting hearts
        maxHearts: 3,
        status: "Dormant",
      });

      // Mark as onboarded
      setIsOnboarded(true);

      // Create user and pet via API calls
      if (account) {
        try {
          // Create user with appropriate types
          const userResponse = await apiService.user.createUser({
            walletAddress: account.address,
            savingsGoal: Math.round(numericSavingsGoal).toString(),
          });

          // Get the created/retrieved user ID
          const userId = userResponse?.data?.id;

          if (userId) {
            // Map the breed to the enum expected by the backend
            const breedEnum = DOGS[selectedDogIndex].breed.toUpperCase();

            // Create pet with the user ID
            await apiService.pet.createPet({
              name: formData.petName || DOGS[selectedDogIndex].name,
              breed: breedEnum,
              userId: userId,
              active: true,
            });
          }
        } catch (error) {
          console.error("Failed to create user or pet:", error);
        }
      }

      // Navigate to app
      router.push("/app");
    }
  };

  const cycleDog = (direction: "next" | "prev") => {
    setSelectedDogIndex((prev) => {
      if (direction === "next") {
        return (prev + 1) % DOGS.length;
      }
      return prev === 0 ? DOGS.length - 1 : prev - 1;
    });
  };

  return (
    <div className="font-patrick-hand text-[#282424] bg-[url('/backgrounds/bg-secondary.png')] bg-cover bg-center min-h-screen py-16 flex flex-col items-center">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto w-full">
        {step === 1 && (
          <div className="w-full space-y-6 text-center">
            <h2 className="text-2xl px-2">
              Hello traveller! We are delighted to have you &lt;3
            </h2>
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
              <Image
                src={`/realms/tiers/tier-${currentTier}.png`}
                alt={`Tier ${currentTier} Realm`}
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xl">Firstly, what is your savings goal?</p>
            <CurrencyInput
              value={formData.savingsGoal}
              onChange={handleSavingsGoalChange}
              placeholder="20,000.00"
              className="text-center text-xl bg-[#F6D998] border-2 border-[#392e1f]"
            />
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-6 text-center">
            <h2 className="text-2xl">Select your guardian angel</h2>
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
              <Image
                src={DOGS[selectedDogIndex].image}
                alt="Guardian Angel"
                fill
                className="object-contain"
              />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full flex justify-between px-2">
                <Image
                  src="/icons/caret.svg"
                  alt="Previous"
                  onClick={() => cycleDog("prev")}
                  width={24}
                  height={24}
                  className="rotate-90 h-8 w-8"
                />
                <Image
                  src="/icons/caret.svg"
                  alt="Next"
                  width={24}
                  height={24}
                  className="-rotate-90 h-8 w-8"
                  onClick={() => cycleDog("next")}
                />
              </div>
            </div>
            <p className="text-xl">Give it a name</p>
            <Input
              type="text"
              name="petName"
              value={formData.petName}
              onChange={handleInputChange}
              placeholder={`${DOGS[selectedDogIndex].name}`}
              className="text-center text-xl bg-[#F6D998] border-2 border-[#392e1f]"
            />
          </div>
        )}

        {step === 3 && (
          <div className="w-full space-y-6 text-center">
            <h2 className="text-2xl">
              {formData.petName} is going to have such a beautiful home. But
              first, it needs an owner!
            </h2>
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
              <Image
                src={DOGS[selectedDogIndex].image}
                alt="Guardian Angel"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xl">What is your name?</p>
            <Input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              placeholder="Eason"
              className="text-center text-xl bg-[#F6D998] border-2 border-[#392e1f]"
            />
          </div>
        )}

        <div className="mt-8 w-full flex justify-center">
          <Button onClick={handleNext} className="text-xl">
            {step === 3 ? "Let's Get Saving!" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
