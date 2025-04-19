import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, Dog, RealmState } from "@/types";

interface GuardianAngel {
  name: string;
  type: string;
  image: string;
}

interface AppStore extends AppState {
  // User Actions
  setWalletAddress: (address: string | null) => void;
  setSavingsGoal: (goal: string) => void;
  setSelectedDog: (dog: Dog | null) => void;
  setUserName: (name: string) => void;
  setIsOnboarded: (status: boolean) => void;
  setGuardianAngel: (angel: GuardianAngel) => void;

  // Realm Actions
  updateRealmStatus: (status: Partial<RealmState>) => void;

  // Reset Action
  reset: () => void;
}

const initialState: AppState = {
  walletAddress: null,
  savingsGoal: "25000",
  selectedDog: {
    breed: "Pomeranian",
    name: "Luna",
    image: "/dogs/pom.png",
  },
  userName: "",
  isOnboarded: false,
  guardianAngel: {
    name: "Lily",
    type: "Nature Spirit",
    image: "/angels/lily.png",
  },
  realm: {
    status: "Flourishing",
    hearts: 2,
    maxHearts: 3,
    savingsGoal: 25000,
    savingsAchieved: 20000,
    tier: 3,
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      // User Actions
      setWalletAddress: (address) =>
        set((state) => ({ ...state, walletAddress: address })),

      setSavingsGoal: (goal) =>
        set((state) => ({ ...state, savingsGoal: goal })),

      setSelectedDog: (dog) => set((state) => ({ ...state, selectedDog: dog })),

      setUserName: (name) => set((state) => ({ ...state, userName: name })),

      setIsOnboarded: (status) =>
        set((state) => ({ ...state, isOnboarded: status })),

      setGuardianAngel: (angel) =>
        set((state) => ({ ...state, guardianAngel: angel })),

      // Realm Actions
      updateRealmStatus: (status) =>
        set((state) => ({
          ...state,
          realm: { ...state.realm, ...status },
        })),

      // Reset Action
      reset: () => set(initialState),
    }),
    {
      name: "pawmise-storage",
    }
  )
);
