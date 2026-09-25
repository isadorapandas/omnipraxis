import { create } from 'zustand';

interface ConvaiStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setClient: (client: any) => void;
}

export const useConvaiStore = create<ConvaiStore>((set) => ({
  client: null,
  setClient: (client) => set({ client }),
}));
