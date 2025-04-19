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
    // ADDED: Get pet endpoint
    getPet: (id: string) => api.get(`pet/${id}`),
  },
  ai: {},
};
