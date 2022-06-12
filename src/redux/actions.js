import * as types from './types'

// INITIALIZES LAUNCHER ON CLIENT
export const setStarting = (payload) => (dispatch) => dispatch({ type: types.STARTING, payload: { isStarting: payload } });

export const startLauncher = () => (dispatch) => dispatch({ type: types.START, payload: { isStarted: true } });

export const stopLauncher = () => (dispatch) => dispatch({ type: types.STOP, payload: { isStarted: false } });

export const setErrorMessage = (payload) => (dispatch) => dispatch({ type: types.ERROR_MESSAGE, payload: { isErrorMessage: payload } });

export const setMode = (payload) => (dispatch) => dispatch({ type: types.MODE, payload: { isMode: payload } });

export const setDelay = (payload) => (dispatch) => dispatch({ type: types.DELAY, payload: { isDelay: payload } });

export const setLanguage = (payload) => (dispatch) => dispatch({ type: types.LANGUAGE, payload: { isLanguage: payload } });

export const setDarkMode = (payload) => (dispatch) => dispatch({ type: types.DARK_MODE, payload: { isDarkMode: payload } });

export const setKey = (payload) => (dispatch) => dispatch({ type: types.KEY, payload: { isKey: payload } });

export const setKeyType = (payload) => (dispatch) => dispatch({ type: types.KEYTYPE, payload: { isKeyType: payload } });

export const setGlobalShortcutActive = (payload) => (dispatch) => dispatch({ type: types.GLOB_SHOR_AC, payload: { isGlobalShortcutActive: payload } });

export const setGlobalShortcut = (payload) => (dispatch) => dispatch({ type: types.GLOB_SHOR, payload: { isGlobalShortcut: payload } });


