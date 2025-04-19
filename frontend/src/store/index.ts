import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, Dog, RealmState, GuardianAngel, ChatMessage } from "@/types";
import { calculateRealmStatus } from "@/lib/realm";
import {
  createHeartSystem,
  addHearts,
  removeHearts,
  resetHearts,
} from "@/lib/heart";

interface AppStore extends AppState {
  // Auth Actions
  setWalletAddress: (address: string | null) => void;
  logout: () => void;

  // User Profile Actions
  setSavingsGoal: (goal: string) => void;
  setSelectedDog: (dog: Dog | null) => void;
  setUserName: (name: string) => void;
  setIsOnboarded: (status: boolean) => void;
  setGuardianAngel: (angel: GuardianAngel) => void;

  // Realm Actions
  updateRealmStatus: (status: Partial<RealmState>) => void;
  addHearts: (amount: number) => void;
  removeHearts: (amount: number) => void;
  resetHearts: () => void;
  updateSavingsProgress: (achieved: number) => void;
  updateTier: (tier: number) => void;

  // Chat Actions
  setChatHistory: (messages: ChatMessage[]) => void;
  clearChatHistory: () => void;

  // Reset Action
  reset: () => void;
}

const heartSystem = createHeartSystem(3);

const initialState: AppState = {
  // Auth
  walletAddress: null,

  // User Profile
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

  // Realm
  realm: {
    status: "Dormant",
    hearts: heartSystem.hearts,
    maxHearts: heartSystem.maxHearts,
    activeHearts: heartSystem.activeHearts,
    savingsGoal: 25000,
    savingsAchieved: 0,
    tier: 1,
  },

  // Chat
  chatHistory: [],

  // Settings
  settings: {
    notificationsEnabled: true,
    soundEnabled: true,
    language: "en",
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Auth Actions
      setWalletAddress: (address) =>
        set((state) => ({ ...state, walletAddress: address })),

      logout: () => {
        // Just reset the state
        set(initialState);
      },

      // User Profile Actions
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

      addHearts: (amount) =>
        set((state) => {
          const updatedSystem = addHearts(
            {
              hearts: state.realm.hearts,
              maxHearts: state.realm.maxHearts,
              activeHearts: state.realm.activeHearts,
            },
            amount
          );
          return {
            ...state,
            realm: {
              ...state.realm,
              ...updatedSystem,
            },
          };
        }),

      removeHearts: (amount) =>
        set((state) => {
          const updatedSystem = removeHearts(
            {
              hearts: state.realm.hearts,
              maxHearts: state.realm.maxHearts,
              activeHearts: state.realm.activeHearts,
            },
            amount
          );
          return {
            ...state,
            realm: {
              ...state.realm,
              ...updatedSystem,
            },
          };
        }),

      resetHearts: () =>
        set((state) => {
          const updatedSystem = resetHearts({
            hearts: state.realm.hearts,
            maxHearts: state.realm.maxHearts,
            activeHearts: state.realm.activeHearts,
          });
          return {
            ...state,
            realm: {
              ...state.realm,
              ...updatedSystem,
            },
          };
        }),

      updateSavingsProgress: (achieved) =>
        set((state) => {
          const newStatus = calculateRealmStatus(
            achieved,
            state.realm.savingsGoal
          );
          return {
            ...state,
            realm: {
              ...state.realm,
              savingsAchieved: achieved,
              status: newStatus,
            },
          };
        }),

      updateTier: (tier) =>
        set((state) => ({
          ...state,
          realm: {
            ...state.realm,
            tier,
          },
        })),

      // Chat Actions
      setChatHistory: (messages) =>
        set((state) => ({ ...state, chatHistory: messages })),

      clearChatHistory: () => set((state) => ({ ...state, chatHistory: [] })),

      // Reset Action
      reset: () => set(initialState),
    }),
    {
      name: "pawmise-storage",
    }
  )
);
