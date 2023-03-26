import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useBearStore = create(
	persist(
		(set, get) => ({
			bears: 0,
			updateBears: () => set((state: any) => ({ bears: state.bears + 1 })),
		}),
		{
			name: "food-storage", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
		}
	)
);

export const useAuthStore = create((set) => ({
	auth: 0,
	increaseAuth: () => {
		set((state: any) => ({ auth: state.auth + 1 }));
	},
}));
