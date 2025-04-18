import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, Dog, RealmState } from "@/types";

interface AppStore extends AppState {
  // User Actions
  setWalletAddress: (address: string | null) => void;
  setSavingsGoal: (goal: string) => void;
  setSelectedDog: (dog: Dog | null) => void;
  setUserName: (name: string) => void;
  setIsOnboarded: (status: boolean) => void;

  // Realm Actions
  updateRealmStatus: (status: Partial<RealmState>) => void;

  // Reset Action
  reset: () => void;
}

const initialState: AppState = {
  walletAddress: null,
  savingsGoal: "",
  selectedDog: null,
  userName: "",
  isOnboarded: false,
  realm: {
    status: "Flourishing",
    hearts: 2,
    maxHearts: 3,
    savingsGoal: 25000,
    savingsAchieved: 20000,
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
