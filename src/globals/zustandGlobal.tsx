import create from "zustand";

interface IModal {
	amount: any;
	click: any;
	updateModal: (newAmount: any) => void;
	updateClick: (newClick: any) => void;
}

export const useModalStore = create<IModal>((set) => ({
	amount: "hello",
	click: false,
	updateClick: (newClick: any) => set({ click: newClick }),
	updateModal: (newAmount: any) => set({ amount: newAmount }),
	retrieveJSONData: async () => {},
}));
