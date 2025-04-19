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

export interface UserState {
  walletAddress: string | null;
  savingsGoal: string;
  selectedDog: Dog | null;
  userName: string;
  isOnboarded: boolean;
  guardianAngel: GuardianAngel;
}

export interface RealmState {
  status: string;
  hearts: number;
  maxHearts: number;
  savingsGoal: number;
  savingsAchieved: number;
  tier: number;
}

export interface AppState extends UserState {
  realm: RealmState;
}
