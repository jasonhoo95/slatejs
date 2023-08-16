import create from "zustand";

interface IModal {
	display: any;
	click: any;
	updateModal: (newDisplay: any) => void;
	updateClick: (newClick: any) => void;
}

export const useModalStore = create<IModal>((set) => ({
	display: false,
	click: false,
	updateClick: (newClick: any) => set({ click: newClick }),
	updateModal: (newDisplay: any) => set({ display: newDisplay }),
	retrieveJSONData: async () => {},
}));
