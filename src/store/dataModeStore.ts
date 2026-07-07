import { create } from 'zustand';

export const DATA_MODES = {
  HIGH: 'high',
  DATA_SAVER: 'data_saver'
};

export const DATA_MODE_OPTIONS = [
  {
    id: DATA_MODES.HIGH,
    icon: '⚡',
    label: 'High Quality',
    description: 'Best video & image quality. Uses more mobile data.',
  },
  {
    id: DATA_MODES.DATA_SAVER,
    icon: '🌱',
    label: 'Data Saver',
    description: 'Reduces video resolution and limits auto-play to save data.',
  },
];

interface DataModeState {
  dataMode: string;
  setDataMode: (mode: string) => void;
}

export const useDataModeStore = create<DataModeState>((set) => ({
  dataMode: DATA_MODES.HIGH,
  setDataMode: (mode) => set({ dataMode: mode }),
}));
