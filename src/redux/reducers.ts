import { AnyAction } from 'redux'
import * as types from './types'

// INITIAL LAUNCHER STATE
const initialLauncherState = {
    isStarting: false,
    isStarted: false,
    isErrorMessage: "",
    isMode: "withTimer",
    isDelay: 200,
    isLanguage: null,
    isDarkMode: null,
    isKeyType: "Mouse",
    isGlobalShortcutActive: false,
    isGlobalShortcut: "Alt+S",

    // RIGHT MOUSE BUTTON
    isKey: "Right"
}

// LAUNCHER REDUCER
const launcherReducer = (state = initialLauncherState, { type, payload }: AnyAction)=> {
    switch (type) {
        case types.STARTING:
            return {
                ...state,
                isStarting: payload.isStarting || false,
            }
        case types.START:
            return {
                ...state,
                isStarted: payload.isStarted,
            }
        case types.STOP:
            return {
                ...state,
                isStarted: payload.isStarted,
            }
        case types.ERROR_MESSAGE:
            return {
                ...state,
                isErrorMessage: payload.isErrorMessage || "",
            }
        case types.MODE:
            return {
                ...state,
                isMode: payload.isMode || "withTimer",
            }
        case types.DELAY:
            return {
                ...state,
                isDelay: payload.isDelay,
            }
        case types.LANGUAGE:
            return {
                ...state,
                isLanguage: payload.isLanguage || "English",
            }
        case types.DARK_MODE:
            return {
                ...state,
                isDarkMode: payload.isDarkMode,
            }
        case types.KEY:
            return {
                ...state,
                isKey: payload.isKey,
            }
        case types.KEYTYPE:
            return {
                ...state,
                isKeyType: payload.isKeyType,
            }
        case types.GLOB_SHOR:
            return {
                ...state,
                isGlobalShortcut: payload.isGlobalShortcut,
            }
        case types.GLOB_SHOR_AC:
            return {
                ...state,
                isGlobalShortcutActive: payload.isGlobalShortcutActive,
            }
        default:
            return state
    }
}

export default launcherReducer;