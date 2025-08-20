import { create } from "zustand"
import { createTauriStore } from '@tauri-store/zustand';

import {
  register,
  unregister,
  isRegistered,
} from "@tauri-apps/plugin-global-shortcut";
import { invoke } from "@tauri-apps/api/core";

type Mode = "withTimer" | "withToggle";
type KeyType = "Mouse" | "Keyboard";
type AvailableLanguages = 'English' | 'Türkçe' | "Русский" | "Español" | "Português" | "Français" | "Deutsch" | "عربي";

type StoreState = {
  isStarting: boolean,
  isStarted: boolean,
  isErrorMessage: string,
  isMode: Mode,
  isDelay: number,
  isLanguage: AvailableLanguages,
  isDarkMode: boolean | null,
  isKeyType: KeyType,
  isGlobalShortcutActive: boolean,
  isGlobalShortcut: string,

  // RIGHT MOUSE BUTTON
  isKey: string
}

type StoreUI = {
  isNotifications: boolean,
  isStartUp: boolean,
  isShortcut: string
}

type StoreActions = {
  setStarting: (payload:
    | StoreState["isStarting"]
    | ((current: StoreState['isStarting']) => StoreState['isStarting']),
  ) => void,
  startLauncher: () => void,
  stopLauncher: () => void,
  setErrorMessage: (payload:
    | StoreState["isErrorMessage"]
    | ((current: StoreState['isErrorMessage']) => StoreState['isErrorMessage']),
  ) => void,
  setMode: (payload:
    | StoreState["isMode"]
    | ((current: StoreState['isMode']) => StoreState['isMode']),
  ) => void,
  setDelay: (payload:
    | StoreState["isDelay"]
    | ((current: StoreState['isDelay']) => StoreState['isDelay']),
  ) => void,
  setLanguage: (payload:
    | StoreState["isLanguage"]
    | ((current: StoreState['isLanguage']) => StoreState['isLanguage']),
  ) => void,
  setDarkMode: (payload:
    | StoreState["isDarkMode"]
    | ((current: StoreState['isDarkMode']) => StoreState['isDarkMode']),
  ) => void,
  setKey: (payload:
    | StoreState["isKey"]
    | ((current: StoreState['isKey']) => StoreState['isKey']),
  ) => void,
  setKeyType: (payload:
    | StoreState["isKeyType"]
    | ((current: StoreState['isKeyType']) => StoreState['isKeyType']),
  ) => void,
  setGlobalShortcutActive: (payload:
    | StoreState["isGlobalShortcutActive"]
    | ((current: StoreState['isGlobalShortcutActive']) => StoreState['isGlobalShortcutActive']),
  ) => void,
  setGlobalShortcut: (payload:
    | StoreState["isGlobalShortcut"]
    | ((current: StoreState['isGlobalShortcut']) => StoreState['isGlobalShortcut']),
  ) => void,
}

type StoreUIActions = {
  setNotifications: (payload: StoreUI["isNotifications"]) => void,
  setStartUp: (payload: StoreUI["isStartUp"]) => void,
  setShortcut: (payload: StoreUI["isShortcut"]) => void,
}

export type Store = StoreState & StoreActions & StoreUI & StoreUIActions;

// INITIAL LAUNCHER STATE
const initialLauncherState = {
  isStarting: false,
  isStarted: false,
  isErrorMessage: "",
  isMode: "withTimer" as Mode,
  isDelay: 200,
  isLanguage: "English",
  isDarkMode: false,
  isKeyType: "Mouse" as KeyType,
  isGlobalShortcutActive: false,
  isGlobalShortcut: "Alt+S",

  // RIGHT MOUSE BUTTON
  isKey: "Right"
} as StoreState;

// INITIAL SETTINGS STATE
const initialSettingsState = {
  isNotifications: true,
  isStartUp: false,
  isShortcut: "Alt+S"
} as StoreUI;

export const useStateStore = create<Store>()(
  (set, get) => ({
    ...{ ...initialLauncherState, ...(initialSettingsState as StoreUI) },
    setStarting: (payload) => set((state) => ({ isStarting: typeof payload === "function" ? payload(state.isStarting) : payload })),
    startLauncher: () => set({ isStarted: true }),
    stopLauncher: () => set({ isStarted: false }),
    setErrorMessage: (payload) => set((state) => ({ isErrorMessage: typeof payload === "function" ? payload(state.isErrorMessage) : payload })),
    setMode: (payload) => set((state) => ({ isMode: typeof payload === "function" ? payload(state.isMode) : payload })),
    setDelay: (payload) => set((state) => ({ isDelay: typeof payload === "function" ? payload(state.isDelay) : payload })),
    setLanguage: (payload) => set((state) => ({ isLanguage: typeof payload === "function" ? payload(state.isLanguage) : payload })),
    setDarkMode: (payload) => set((state) => ({ isDarkMode: typeof payload === "function" ? payload(state.isDarkMode) : payload })),
    setKeyType: (payload) => set((state) => ({ isKeyType: typeof payload === "function" ? payload(state.isKeyType) : payload })),
    setKey: (payload) => set((state) => ({ isKey: typeof payload === "function" ? payload(state.isKey) : payload })),
    setGlobalShortcutActive: (payload) => set((state) => ({ isGlobalShortcutActive: typeof payload === "function" ? payload(state.isGlobalShortcutActive) : payload })),
    setGlobalShortcut: (payload) => {
      let isGlobalShortcut = get().isGlobalShortcut;

      // unregister previous shortcut
      isRegistered(isGlobalShortcut).then((res1) => {
        if (res1) unregister(isGlobalShortcut);
      });

      let newIsGlobalShortcut = typeof payload === "function" ? payload(isGlobalShortcut) : payload;

      // register new shortcut
      isRegistered(newIsGlobalShortcut).then((res1) => {
        if (!res1)
          register(newIsGlobalShortcut, (event) => {
            if (event.state === "Pressed") {
              invoke("start_stop_global_shortcut_pressed", {
                invokeMessage: true,
              });
            }
          });
      });

      set((_state) => ({ isGlobalShortcut: newIsGlobalShortcut }));
    },
    // Settings Actions
    setNotifications: (payload) => set(() => ({ isNotifications: payload })),
    setStartUp: (payload) => set(() => ({ isStartUp: payload })),
    setShortcut: (payload) => set(() => ({ isShortcut: payload })),
  })
);

// A handle to the Tauri plugin.
// We will need this to start the store.
export const tauriHandler = createTauriStore('launcher-storage', useStateStore, {
  autoStart: true,
  saveOnChange: true,
  saveStrategy: 'debounce',
  saveInterval: 500, //ms
  filterKeys: ["isGlobalShortcutActive", "isErrorMessage", "isStarted", "isStarting"]
});

