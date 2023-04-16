import * as types from "./types";
import { Dispatch, AnyAction } from "redux";

export type Action = {
  type: string;
  payload: any;
};

export const setStarting = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.STARTING, payload: { isStarting: payload } });

export const startLauncher = () => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.START, payload: { isStarted: true } });

export const stopLauncher = () => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.STOP, payload: { isStarted: false } });

export const setErrorMessage = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.ERROR_MESSAGE, payload: { isErrorMessage: payload } });

export const setMode = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.MODE, payload: { isMode: payload } });

export const setDelay = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.DELAY, payload: { isDelay: payload } });

export const setLanguage = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.LANGUAGE, payload: { isLanguage: payload } });

export const setDarkMode = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.DARK_MODE, payload: { isDarkMode: payload } });

export const setKey = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.KEY, payload: { isKey: payload } });

export const setKeyType = (payload: any) => (dispatch: Dispatch<Action>) =>
  dispatch({ type: types.KEYTYPE, payload: { isKeyType: payload } });

export const setGlobalShortcutActive =
  (payload: any) => (dispatch: Dispatch<Action>) =>
    dispatch({
      type: types.GLOB_SHOR_AC,
      payload: { isGlobalShortcutActive: payload },
    });

export const setGlobalShortcut =
  (payload: any) => (dispatch: Dispatch<Action>) =>
    dispatch({ type: types.GLOB_SHOR, payload: { isGlobalShortcut: payload } });
