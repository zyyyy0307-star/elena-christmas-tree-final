import { create } from 'zustand';

interface AppState {
  expansion: number; // 0 = Tree (Assembled), 1 = Chaos (Scattered)
  setExpansion: (val: number) => void;
  
  isTracking: boolean;
  setIsTracking: (val: boolean) => void;

  focusedPhotoId: string | null;
  setFocusedPhotoId: (id: string | null) => void;

  focusedPhotoUrl: string | null;
  setFocusedPhotoUrl: (url: string | null) => void;

  // Finale State
  visitedPhotoIds: string[];
  addVisitedPhotoId: (id: string) => void;
  
  isFinalePending: boolean;
  setFinalePending: (val: boolean) => void;

  isFinale: boolean;
  triggerFinale: () => void;
}

export const useStore = create<AppState>((set) => ({
  expansion: 0,
  setExpansion: (val) => set({ expansion: val }),
  
  isTracking: false,
  setIsTracking: (val) => set({ isTracking: val }),

  focusedPhotoId: null,
  setFocusedPhotoId: (id) => set({ focusedPhotoId: id }),

  focusedPhotoUrl: null,
  setFocusedPhotoUrl: (url) => set({ focusedPhotoUrl: url }),

  visitedPhotoIds: [],
  addVisitedPhotoId: (id) => set((state) => {
    if (state.visitedPhotoIds.includes(id)) return {};
    return { visitedPhotoIds: [...state.visitedPhotoIds, id] };
  }),

  isFinalePending: false,
  setFinalePending: (val) => set({ isFinalePending: val }),

  isFinale: false,
  triggerFinale: () => set({ isFinale: true }),
}));