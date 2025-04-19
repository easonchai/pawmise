import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiService = {
  user: {
    getUser: (address: string) => api.get(`users/address/${address}`),
    createUser: (data: { walletAddress: string; savingsGoal: string }) =>
      api.post("users", data),
  },
  pet: {
    createPet: (data: {
      name: string;
      breed: string;
      userId: string;
      active: boolean;
    }) => api.post("pet", data),
    getPet: (id: string) => api.get(`pet/${id}`),
    getActivePetByUserId: (userId: string) =>
      api.get(`pet/active/user/${userId}`),
  },
  ai: {
    emergencyWithdrawal: (address: string) =>
      api.post(`ai-agent/${address}/emergency-withdrawal`),
  },
};
