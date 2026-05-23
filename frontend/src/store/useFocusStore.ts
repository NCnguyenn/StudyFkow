import { create } from 'zustand';

export type FocusPhase = 'SETUP' | 'FOCUSING' | 'WARNING' | 'ABANDONED' | 'BREAK' | 'COMPLETED';

interface FocusPreset {
  name: string;
  focusMinutes: number;
  breakMinutes: number;
}

export const FOCUS_PRESETS: Record<string, FocusPreset> = {
  classic: { name: 'Classic (25/5)', focusMinutes: 25, breakMinutes: 5 },
  deepWork: { name: 'Deep Work (50/10)', focusMinutes: 50, breakMinutes: 10 },
  custom: { name: 'Custom', focusMinutes: 25, breakMinutes: 5 },
};

interface FocusState {
  phase: FocusPhase;
  timeLeft: number; // in seconds
  isLoopMode: boolean;
  linkedTaskId: string | null;
  soundscape: string;
  preset: FocusPreset;
  isPaused: boolean;

  setPhase: (phase: FocusPhase) => void;
  setLinkedTask: (taskId: string | null) => void;
  setSoundscape: (soundscape: string) => void;
  setPreset: (presetKey: string, customFocus?: number, customBreak?: number) => void;
  toggleLoopMode: () => void;
  togglePause: () => void;

  startSession: () => void;
  tick: () => void;
  abortSession: () => void;
  transitionPhase: () => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  phase: 'SETUP',
  timeLeft: FOCUS_PRESETS.classic.focusMinutes * 60,
  isLoopMode: false,
  linkedTaskId: null,
  soundscape: 'rainy_cafe',
  preset: FOCUS_PRESETS.classic,
  isPaused: false,

  setPhase: (phase) => set({ phase }),
  setLinkedTask: (taskId) => set({ linkedTaskId: taskId }),
  setSoundscape: (soundscape) => set({ soundscape }),
  
  setPreset: (presetKey, customFocus, customBreak) => {
    let newPreset = FOCUS_PRESETS[presetKey];
    if (presetKey === 'custom' && customFocus && customBreak) {
      newPreset = { name: 'Custom', focusMinutes: customFocus, breakMinutes: customBreak };
    }
    set({ preset: newPreset, timeLeft: newPreset.focusMinutes * 60 });
  },

  toggleLoopMode: () => set(state => ({ isLoopMode: !state.isLoopMode })),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  startSession: () => {
    const { preset } = get();
    set({ phase: 'FOCUSING', timeLeft: preset.focusMinutes * 60, isPaused: false });
  },

  tick: () => {
    const { phase, timeLeft, transitionPhase } = get();
    if (phase !== 'FOCUSING' && phase !== 'WARNING' && phase !== 'BREAK') return;

    if (timeLeft > 0) {
      const newTimeLeft = timeLeft - 1;
      // Transition to WARNING if 60 seconds left during FOCUSING
      if (phase === 'FOCUSING' && newTimeLeft <= 60) {
        set({ timeLeft: newTimeLeft, phase: 'WARNING' });
      } else {
        set({ timeLeft: newTimeLeft });
      }
    } else {
      transitionPhase();
    }
  },

  abortSession: () => {
    const { preset } = get();
    set({ phase: 'SETUP', timeLeft: preset.focusMinutes * 60, isPaused: false });
  },

  transitionPhase: () => {
    const { phase, preset, isLoopMode } = get();
    
    if (phase === 'FOCUSING' || phase === 'WARNING') {
      set({ phase: 'BREAK', timeLeft: preset.breakMinutes * 60 });
    } else if (phase === 'BREAK') {
      if (isLoopMode) {
        set({ phase: 'FOCUSING', timeLeft: preset.focusMinutes * 60 });
      } else {
        set({ phase: 'COMPLETED', timeLeft: 0 });
      }
    }
  }
}));
