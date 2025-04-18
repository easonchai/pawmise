export interface Dog {
  breed: string;
  name: string;
}

export interface UserState {
  walletAddress: string | null;
  savingsGoal: string;
  selectedDog: Dog | null;
  userName: string;
  isOnboarded: boolean;
}

export interface RealmState {
  status: string;
  hearts: number;
  maxHearts: number;
  savingsGoal: number;
  savingsAchieved: number;
}

export interface AppState extends UserState {
  realm: RealmState;
}
