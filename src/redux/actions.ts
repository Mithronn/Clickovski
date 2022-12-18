import * as types from "./types";
import { Dispatch, AnyAction } from 'redux'

// INITIALIZES LAUNCHER ON CLIENT
export const setStarting = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.STARTING, payload: { isStarting: payload } } as AnyAction);

export const startLauncher = () => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.START, payload: { isStarted: true } } as AnyAction);

export const stopLauncher = () => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.STOP, payload: { isStarted: false } } as AnyAction);

export const setErrorMessage = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.ERROR_MESSAGE, payload: { isErrorMessage: payload } } as AnyAction);

export const setMode = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.MODE, payload: { isMode: payload } } as AnyAction);

export const setDelay = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.DELAY, payload: { isDelay: payload } } as AnyAction);

export const setLanguage = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.LANGUAGE, payload: { isLanguage: payload } } as AnyAction);

export const setDarkMode = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.DARK_MODE, payload: { isDarkMode: payload } } as AnyAction);

export const setKey = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.KEY, payload: { isKey: payload } } as AnyAction);

export const setKeyType = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.KEYTYPE, payload: { isKeyType: payload } } as AnyAction);

export const setGlobalShortcutActive = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({
    type: types.GLOB_SHOR_AC,
    payload: { isGlobalShortcutActive: payload },
  } as AnyAction);

export const setGlobalShortcut = (payload: any) => (dispatch: Dispatch<AnyAction>) =>
  dispatch({ type: types.GLOB_SHOR, payload: { isGlobalShortcut: payload } } as AnyAction);
