import React from 'react'
import { useRouter } from 'next/router'
const { motion, AnimatePresence } = require('framer-motion');
import { useDispatch, useSelector } from 'react-redux'
import { emit, listen } from '@tauri-apps/api/event'
import { getI18n, useTranslation } from 'react-i18next'
import localforage from 'localforage';

import { startLauncher, stopLauncher, setStarting, setErrorMessage } from '../redux/actions';
import { transition } from "../lib/constants.js";
import useTheme from '../components/useTheme';
import EventEmitter from "../utils/EventEmitter";

function Launcher() {
    const { t, i18n } = useTranslation();

    const router = useRouter();
    const [isVersionShow, setVersionShow] = React.useState(false);
    const [isVersion, setVersion] = React.useState("");
    const reduxState = useSelector((state: any) => state);
    const theme = useTheme(reduxState);
    const dispatch = useDispatch();

    React.useEffect(() => {
        window.__TAURI__.app.getVersion().then((version) => {
            setVersion(String(version).trim() !== "" ? `v${version}` : "");
        }).catch((error) => {
            setVersion("");
        });

        const handlewatchShortcutStartStopListen = (event) => {
            EventEmitter.emit("start_stop_event_FtoF", event.payload);
        };

        const LauncherStartStop = (data) => {
            if (!data.isRunning) {
                start(data.isMode, data.isDelay);
            } else {
                stop(data.isMode);
            }
        }

        const watchShortcutStartStopListen = listen("start_stop_event", handlewatchShortcutStartStopListen);
        const FtoFListener = EventEmitter.addListener("start_stop_event_FtoF", LauncherStartStop);
        return () => {
            watchShortcutStartStopListen.then((f) => f());
            FtoFListener.remove();
        }
    }, []);

    //Global shortcut watcher
    React.useEffect(() => {
        localforage.getItem("settings").then(res => {
            // unregister previous shortcut
            if (JSON.parse(res).isShortcut) {
                let globalShortcut = JSON.parse(res).isShortcut;
                window.__TAURI__.globalShortcut.isRegistered(globalShortcut).then(res1 => {
                    if (res1) { // not registered yet
                        window.__TAURI__.globalShortcut.unregister(globalShortcut);
                    }
                })
            }

            // set new shortcut to localforage
            localforage.setItem("settings", JSON.stringify({ ...JSON.parse(res), isShortcut: reduxState.isGlobalShortcut }));

            // register new shortcut
            window.__TAURI__.globalShortcut.isRegistered(reduxState.isGlobalShortcut).then(res1 => {
                if (!res1) { // not registered yet
                    // console.log("registering")
                    window.__TAURI__.globalShortcut.register(reduxState.isGlobalShortcut, (globalShortcut) => {
                        window.__TAURI__.invoke("start_stop_global_shortcut_pressed", { invokeMessage: true });
                    });
                }
            })
        })
    }, [reduxState.isGlobalShortcut])

    // Version state handler
    React.useEffect(() => {
        setVersionShow(router.pathname === "/settings" ? true : false);
    }, [router])

    function start(isMode = null, isDelay = null) {
        dispatch(setErrorMessage(""));

        if (isDelay) {
            if (isDelay <= 0) {
                return dispatch(setErrorMessage(t('delay_error')));
            }
        } else {
            if (Number(reduxState.isDelay) <= 0) {
                return dispatch(setErrorMessage(t('delay_error')));
            }
        }

        dispatch(setStarting(true));

        window.__TAURI__.invoke('start_launcher').then((res) => {
            dispatch(startLauncher());


            localforage.getItem("settings").then(res => {
                if (JSON.parse(String(res))?.isNotifications) {
                    if (isMode && isMode === "withTimer") {
                        window.__TAURI__.invoke('show_notification', {
                            invokeMessage: JSON.stringify({
                                body: t('click_start', { delay: (1000 / Number(isDelay)).toFixed(1) }),
                            })
                        });
                    } else if (isMode && isMode === "withToggle") {
                        window.__TAURI__.invoke('show_notification', {
                            invokeMessage: JSON.stringify({
                                body: t('hold_start'),
                            })
                        });
                    } else {
                        if (reduxState.isMode === "withTimer") {
                            window.__TAURI__.invoke('show_notification', {
                                invokeMessage: JSON.stringify({
                                    body: t('click_start', { delay: (1000 / Number(reduxState.isDelay)).toFixed(1) }),
                                })
                            });
                        } else if (reduxState.isMode === "withToggle") {
                            window.__TAURI__.invoke('show_notification', {
                                invokeMessage: JSON.stringify({
                                    body: t('hold_start'),
                                })
                            });
                        }
                    }
                }
            })
            dispatch(setStarting(false));
        }).catch((err) => {
            dispatch(setErrorMessage(err));
        })
    }

    function stop(isMode = null) {
        window.__TAURI__.invoke('stop_launcher');
        dispatch(stopLauncher());
        localforage.getItem("settings").then(res => {
            if (JSON.parse(String(res))?.isNotifications) {
                if (isMode && isMode === "withTimer") {
                    window.__TAURI__.invoke('show_notification', {
                        invokeMessage: JSON.stringify({
                            body: t('click_stop'),
                        })
                    });
                } else if (isMode && isMode === "withToggle") {
                    window.__TAURI__.invoke('show_notification', {
                        invokeMessage: JSON.stringify({
                            body: t('press_and_hold'),
                        })
                    });
                } else {
                    if (reduxState.isMode === "withTimer") {
                        window.__TAURI__.invoke('show_notification', {
                            invokeMessage: JSON.stringify({
                                body: t('click_stop'),
                            })
                        });
                    } else if (reduxState.isMode === "withToggle") {
                        window.__TAURI__.invoke('show_notification', {
                            invokeMessage: JSON.stringify({
                                body: t('press_and_hold'),
                            })
                        });
                    }
                }
            }
        })

    }

    if (router.pathname === "/update") {
        return null;
    }

    return (
        <div
            className={`h-16 border-t-2 border-[rgba(0,0,0,0.05)] relative p-6 flex flex-row items-center justify-between shadow-inner ${theme ? "bg-darkestgray" : "bg-white"} duration-150`}
        >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <button
                    onClick={reduxState.isStarted ? stop : start}
                    className="outline-none focus:outline-none pl-4 pr-4 pt-2 pb-2 min-w-[100px] flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-gray-200 font-Readex duration-150">
                    {reduxState.isStarted ? `${t('stop', { keys: String(reduxState.isGlobalShortcut).split("+").map((value) => value.slice(0, 4)).join(" + ") })}` : `${t('start', { keys: String(reduxState.isGlobalShortcut).split("+").map((value) => value.slice(0, 4)).join(" + ") })}`}
                </button>
            </div>

            <div></div>

            <div
                className="flex items-center justify-center w-1/2 h-1 absolute left-1/2 top-2/3 -translate-y-2/3 -translate-x-1/2">
                <p className="text-red-500 font-Readex text-xs text-center break-words">{reduxState.isErrorMessage}</p>
            </div>

            <AnimatePresence>
                {isVersionShow &&
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transition}
                    >
                        <p className="font-Readex text-gray-400 text-xs font-bold select-none">{isVersion}</p>
                    </motion.div>
                }
            </AnimatePresence>

        </div>
    )
}

export default Launcher