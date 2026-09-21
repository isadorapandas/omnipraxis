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

/*
import { useConvaiClient } from '@convai/web-sdk/react';
import { create } from 'zustand';

type ReactConvaiClient = ReturnType<typeof useConvaiClient>;

interface ConvaiStore {
  client: ReactConvaiClient | null;
  setClient: (client: ReactConvaiClient) => void;
}

export const useConvaiStore = create<ConvaiStore>((set) => ({
  client: null,
  setClient: (client) => set({ client }),
}));
*/