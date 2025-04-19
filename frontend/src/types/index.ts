import { RealmStatus } from "@/lib/realm";

export interface Dog {
  breed: string;
  name: string;
  image: string;
}

export interface GuardianAngel {
  name: string;
  type: string;
  image: string;
}

export interface ChatMessage {
  content: string;
  isUser: boolean;
}

export interface Settings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  language: string;
}

export interface UserState {
  walletAddress: string | null;
  // savingsGoal: string;
  selectedDog: Dog | null;
  userName: string;
  isOnboarded: boolean;
  guardianAngel: GuardianAngel;
}

export interface RealmState {
  status: RealmStatus;
  hearts: number;
  maxHearts: number;
  activeHearts: number;
  savingsGoal: number;
  savingsAchieved: number;
  tier: number;
}

export interface AppState extends UserState {
  realm: RealmState;
  chatHistory: ChatMessage[];
  settings: Settings;
}
