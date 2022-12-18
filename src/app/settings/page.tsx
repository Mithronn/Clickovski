"use client"

import React from 'react'
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClickAwayListener,
    Switch
} from "@mui/material"
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux'
import localforage from 'localforage';
import { useTranslation } from 'react-i18next'

import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";


import { RightIcon, SettingsIcon, RecordIcon } from "../../components/icons";
import { transition, defaultStoreData } from "../../lib/constants";
import Flags from "../../components/Flags";
import styles from "../../styles/CSS.module.css";
import { setLanguage as setLanguageForRedux, setDarkMode as setDarkModeForRedux, setGlobalShortcut } from '../../redux/actions';
import useTheme from "../../components/useTheme";
import { useTheme as useNextTheme } from "../../components/Theme";
import Link from 'next/link';


function Settings() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const reduxState = useSelector((state: any) => state);
    const { setTheme } = useNextTheme();
    const isDarkMode = useTheme()
    const dispatch = useDispatch();
    const KeyboardEventListenerRef = React.useRef<HTMLButtonElement>();

    const [isActivatedSettings, setActivatedSettings] = React.useState([]);
    const [isLanguage, setLanguage] = React.useState("English");
    const [isLanguageOpen, setLanguageOpen] = React.useState(false);
    const [isDarkMode2, setDarkMode] = React.useState(false);

    const [isListeningKeyboard, setListeningKeyboard] = React.useState(false);
    const [isListenedKeys, setListenedKeys] = React.useState(reduxState.isGlobalShortcut ? String(reduxState.isGlobalShortcut).split("+") : []);
    const [timeoutListener, setTimeoutListener] = React.useState(null);

    const setLanguageFunction = async (item: any) => {
        setLanguage(item.name);
        localforage.getItem("settings").then((res: any) => {
            localforage.setItem("settings", JSON.stringify({ ...JSON.parse(res), language: item.name }))
        }).catch(err => {
            localforage.setItem("settings", JSON.stringify({ ...defaultStoreData, language: item.name }))
        })
        dispatch(setLanguageForRedux(item.name));
        await i18n.changeLanguage(item.name);
        appWindow.setTitle(`Clickovski - ${t('settings')}`);
        setLanguageOpen(!isLanguageOpen);
    }

    const setNotifications = () => {
        localforage.getItem("settings").then((res: any) => {
            localforage.setItem("settings", JSON.stringify({ ...JSON.parse(res), isNotifications: isActivatedSettings.find(x => x === "isNotifications") ? false : true }))
        }).catch(err => {
            localforage.setItem("settings", JSON.stringify({ ...defaultStoreData, isNotifications: isActivatedSettings.find(x => x === "isNotifications") ? false : true }))
        })
        !!isActivatedSettings.find(x => x === "isNotifications") ? setActivatedSettings(state => state.filter(x => x !== "isNotifications")) : setActivatedSettings(state => [...state, "isNotifications"]);
    }

    const setStartUp = () => {
        localforage.getItem("settings").then((res: any) => {
            let startUpState = isActivatedSettings.find(x => x === "isStartUp");
            if (startUpState) {
                invoke("plugin:autostart|disable").then((a /* this is void */) => { });// tauri plugin function
            } else {
                invoke("plugin:autostart|enable").then((a /* this is void */) => { });// tauri plugin function
            }
            localforage.setItem("settings", JSON.stringify({ ...JSON.parse(res), isStartUp: startUpState ? false : true }))
        }).catch(err => {
            localforage.setItem("settings", JSON.stringify({ ...defaultStoreData, isStartUp: isActivatedSettings.find(x => x === "isStartUp") ? false : true }))
        })
        !!isActivatedSettings.find(x => x === "isStartUp") ? setActivatedSettings(state => state.filter(x => x !== "isStartUp")) : setActivatedSettings(state => [...state, "isStartUp"]);
    }

    const setDarkModeFunc = () => {
        localforage.getItem("settings").then((res: any) => {
            localforage.setItem("settings", JSON.stringify({ ...JSON.parse(res), isDarkMode: isActivatedSettings.find(x => x === "isDarkMode") ? false : true }));
            setTheme(isActivatedSettings.find(x => x === "isDarkMode") ? "light" : "dark")
        }).catch(err => {
            localforage.setItem("settings", JSON.stringify({ ...defaultStoreData, isDarkMode: isActivatedSettings.find(x => x === "isDarkMode") ? false : true }))
            setTheme(isActivatedSettings.find(x => x === "isDarkMode") ? "light" : "dark")
        })
        setDarkMode(isActivatedSettings.find(x => x === "isDarkMode") ? false : true);
        dispatch(setDarkModeForRedux(isActivatedSettings.find(x => x === "isDarkMode") ? false : true));
        isActivatedSettings.find(x => x === "isDarkMode") ? setActivatedSettings(state => state.filter(x => x !== "isDarkMode")) : setActivatedSettings(state => [...state, "isDarkMode"]);
    }

    React.useEffect(() => {
        localforage.getItem("settings").then((res: any) => {
            let datas = JSON.parse(res);
            setLanguage(datas.language);
            let array = [];
            for (const [key, value] of Object.entries(datas)) {
                if (value) {
                    array.push(key);
                }
            }
            if (array.includes("isDarkMode")) {
                setDarkMode(true)
            } else {
                setDarkMode(false);
            }

            // set startup state to local state
            invoke("plugin:autostart|is_enabled").then((enabledState) => { // tauri plugin function
                if (enabledState && !array.find(x => x === "isStartUp")) {
                    array.push("isStartUp");
                }

                if (!enabledState && array.find(x => x === "isStartUp")) {
                    array = array.filter(x => x !== "isStartUp");
                }

                setActivatedSettings(array);
            }).catch(error => {
                setActivatedSettings(array);
            })
        }).catch(() => {
            let datas = defaultStoreData;
        });

        appWindow.setTitle(`Clickovski - ${t('settings')}`);
    }, [])

    // Global Shortcuts functions
    React.useEffect(() => {
        if (KeyboardEventListenerRef && KeyboardEventListenerRef.current) {
            if (isListeningKeyboard) {

                if (timeoutListener) {
                    clearTimeout(timeoutListener);
                }
                setTimeoutListener(null);

                setListenedKeys([]);
                KeyboardEventListenerRef.current.onkeydown = (e) => KeyboardEventListenerFunction(e);
            } else {
                // remove everything after 3rd character
                let removedKeys: string[] | Set<string> = isListenedKeys;
                if (isListenedKeys.length > 3) {
                    setListenedKeys((keys) => [keys[0], keys[1], keys[2]]);
                    removedKeys = [isListenedKeys[0], isListenedKeys[1], isListenedKeys[2]];
                }

                if (timeoutListener) {
                    clearTimeout(timeoutListener);
                }
                setTimeoutListener(null);

                if (isListenedKeys.length === 0) {
                    setListenedKeys(reduxState.isGlobalShortcut ? String(reduxState.isGlobalShortcut).split("+") : []);
                }

                if (isListenedKeys.length > 0) {
                    // console.log("push to backend", removedKeys)
                    removedKeys = new Set(removedKeys);
                    removedKeys = Array.from(removedKeys);
                    setListenedKeys(removedKeys);
                    dispatch(setGlobalShortcut(removedKeys.join("+").trim()));
                }
                KeyboardEventListenerRef.current.onkeydown = null;
            }
        }
    }, [isListeningKeyboard]);

    React.useEffect(() => {
        if (timeoutListener) {
            clearTimeout(timeoutListener);
        }
        setTimeoutListener(null);

        setTimeoutListener(setTimeout(() => {
            setListeningKeyboard(false);
            if (isListenedKeys.length === 0) {
                setListenedKeys(reduxState.isGlobalShortcut ? String(reduxState.isGlobalShortcut).split("+") : []);
            }
        }, 2000));
    }, [isListenedKeys]);

    React.useEffect(() => {
        if (isListenedKeys.length >= 3) {
            setListeningKeyboard(false);

            if (timeoutListener) {
                clearTimeout(timeoutListener);
            }
            setTimeoutListener(null);
        }
    }, [isListenedKeys]);

    function KeyboardEventListenerFunction(e) {
        // console.log(e.key)
        e.preventDefault();
        if (String(e.key).trim() === "") {
            setListenedKeys((keys) => [...keys, "Space"]);
        } else if (String(e.key).trim() === "+") {
            setListenedKeys((keys) => [...keys, "Plus"]);
        } else if (["Home", "NumLock", "ScrollLock", "Pause", "Insert"].includes(String(e.key).trim())) {
            // Do nothing they are not supported keys in rust package enigo@0.0.14
        } else {
            setListenedKeys((keys) => [...keys, String(String(e.key).charAt(0).toUpperCase() + String(e.key).slice(1)).trim()]);
        }
    }

    return (
        <div className={`max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] p-6 pb-12 overflow-hidden ${isDarkMode ? "bg-darkgray" : "bg-white"} duration-150 overflow-x-hidden overflow-y-auto ${!isDarkMode ? `${styles.styledScrollbar} ${styles.backgroundImage}` : `${styles.styledScrollbar2} ${styles.backgroundImage2}`}`}>
            {/* <Head>
                <title>Clickovski - {t('settings')}</title>
            </Head> */}

            <div className='w-full relative h-full'>
                <motion.button
                    // exit={{ opacity: 0 }}
                    className='group p-2 outline-none focus:outline-none opacity-100 absolute top-0 left-0 cursor-default'
                    transition={transition}
                    onClick={() => { }}
                >
                    <motion.div
                        layoutId="settings-gear"
                    >
                        <SettingsIcon className={`${isDarkMode ? "text-white" : "text-black"} duration-150`} width='18' height='18' />
                    </motion.div>
                </motion.button>

                <motion.p
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    className={`font-Readex font-bold opacity-0 left-8 top-0 absolute p-1 select-none ${isDarkMode ? "text-white" : "text-black"} duration-150`}
                >
                    {t('settings')}
                </motion.p>

                <Link href={"/"}>
                    <motion.button
                        exit={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={transition}
                        className='opacity-0 absolute right-0 top-0 p-2 outline-none focus:outline-none'
                    >
                        <RightIcon className={`${isDarkMode ? "text-white" : "text-black"} duration-150`} width='16' height='16' />
                    </motion.button>
                </Link>
            </div>

            <motion.div
                exit={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition}
                className={`opacity-0 border-t-2 ${isDarkMode ? "border-[rgba(255,255,255,0.05)]" : "border-[rgba(0,0,0,0.05)]"} mt-12 flex flex-col space-y-6 pt-4 w-full h-full`}
            >
                <div className="flex flex-col space-y-6">
                    <p className={`font-Readex text-base select-none ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('general')}</p>
                    <div className="flex flex-col space-y-5 pl-2 pr-2">
                        <label className="flex flex-row justify-between items-center cursor-pointer">
                            <p className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('start_up')}</p>
                            <AntSwitch
                                onClick={() => setStartUp()}
                                checked={!!isActivatedSettings.find(x => x === "isStartUp")}
                            />
                        </label>
                        <label className="flex flex-row justify-between items-center cursor-pointer">
                            <p className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('show_notifications')}</p>
                            <AntSwitch
                                onClick={() => setNotifications()}
                                checked={!!isActivatedSettings.find(x => x === "isNotifications")}
                            />
                        </label>
                        <label className="flex flex-row justify-between items-center cursor-pointer">
                            <p className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('dark_mode')}</p>
                            <AntSwitch
                                onClick={() => setDarkModeFunc()}
                                checked={!!isActivatedSettings.find(x => x === "isDarkMode")}
                            />
                        </label>

                        <div className="flex flex-row justify-between ">
                            <p className={`font-Readex text-sm select-none ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('shortcut_key')}</p>
                            <ClickAwayListener onClickAway={() => setListeningKeyboard(false)}>
                                <button
                                    ref={KeyboardEventListenerRef}
                                    onClick={() => setListeningKeyboard(state => !state)}
                                    className={`outline-none flex flex-row overflow-hidden justify-between items-center relative focus:outline-none w-1/2 rounded-md pr-4 pt-1 pb-1 font-Readex ${isListeningKeyboard ? "shadow-[#ff7070]" : "shadow-[#ff707000]"} shadow-[0px_0px_30px_0px]  ${isDarkMode ? "text-white bg-darkestgray" : "text-black bg-gray-200"} duration-150`}
                                >
                                    <div className="flex flex-row space-x-1 items-center w-full">
                                        <p className={`font-Readex font-bold text-base select-none text-opacity-0  ${isDarkMode ? "text-white" : "text-black"} duration-150`}>#</p>
                                        {isListenedKeys.map((key, i) => (
                                            <p
                                                key={`keyboard_key_sequence_global_shortcut_letter_${i}`}
                                                className={`font-Readex font-bold text-sm select-none  ${isDarkMode ? "text-white" : "text-black"} duration-150`}>
                                                {key} {i !== isListenedKeys.length - 1 && " +"}
                                            </p>
                                        ))}
                                    </div>

                                    <span className="relative -top-[calc(50%-4px)] -left-2">
                                        {isListeningKeyboard && <span className={`animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 ${isListeningKeyboard ? "opacity-75" : "opacity-0"} duration-150`}></span>}
                                        <RecordIcon className={`absolute inline-flex ${isDarkMode ? isListeningKeyboard ? "text-red-500" : "text-gray-500" : isListeningKeyboard ? "text-red-500" : "text-gray-400"} duration-150`} width='16' height='16' />
                                    </span>
                                </button>
                            </ClickAwayListener>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <p className={`font-Readex text-base select-none ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{t('language')}</p>
                    <ClickAwayListener onClickAway={() => setLanguageOpen(false)}>
                        <div className="relative flex md:max-w-[50%] lg:max-w-[60%] max-w-[100%]">
                            <button
                                onClick={() => setLanguageOpen(!isLanguageOpen)}
                                className={`relative border border-transparent w-full flex flex-row space-x-3 items-center p-3 ${isDarkMode ? "bg-darkestgray shadow-xl" : "bg-gray-200 shadow"} rounded-lg outline-none focus:outline-none duration-150`}
                            >
                                <Flags
                                    language={isLanguage}
                                    className="w-[18px] h-[18px] rounded"
                                />
                                <p className={`font-Readex select-none ${isDarkMode ? "text-white" : "text-black"} duration-150`}>{isLanguage}</p>
                                <motion.div
                                    animate={isLanguageOpen ? { rotate: 90 } : { rotate: -90 }}
                                    className="absolute right-4"
                                >
                                    <RightIcon className={`${isDarkMode ? "text-white" : "text-black"} duration-150`} width="12" height="12" />
                                </motion.div>
                            </button>


                            <AnimatePresence>
                                {isLanguageOpen &&
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, top: 40 }}
                                        animate={{ opacity: 1, top: 54 }}
                                        exit={{ opacity: 0, top: 40 }}
                                        transition={{ type: "spring", duration: 0.2 }}
                                        className={`w-full p-3 absolute ${isDarkMode ? "bg-darkestgray shadow-xl" : "bg-gray-200 shadow-lg"} rounded-lg outline-none focus:outline-none max-h-64 overflow-x-hidden overflow-y-auto ${styles.styledScrollbar}`}
                                    >
                                        {
                                            [
                                                { name: "English" },
                                                { name: "Türkçe" },
                                            ].map((item, i) => (
                                                <button
                                                    onClick={() => setLanguageFunction(item)}
                                                    key={`language_item_${i}`}
                                                    className={`p-2 flex w-full ${isDarkMode ? "hover:bg-blue-600" : "hover:bg-blue-200"} flex-row space-x-3 items-center rounded focus:outline-none outline-none`}
                                                >

                                                    <Flags
                                                        language={item.name}
                                                        className="w-[18px] h-[18px] rounded"
                                                    />
                                                    <p className={`${isDarkMode ? "text-white" : "text-black"} duration-150 font-Readex select-none`}>{item.name}</p>
                                                </button>
                                            ))
                                        }
                                    </motion.div>
                                }
                            </AnimatePresence>
                        </div>
                    </ClickAwayListener>
                </div>
            </motion.div>
        </div>
    )
}

const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
    '&:active': {
        '& .MuiSwitch-thumb': {
            width: 15,
        },
        '& .MuiSwitch-switchBase.Mui-checked': {
            transform: 'translateX(9px)',
        },
    },
    '& .MuiSwitch-switchBase': {
        padding: 2,
        '&.Mui-checked': {
            transform: 'translateX(12px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#177ddc' : '#1890ff',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
        width: 12,
        height: 12,
        borderRadius: 6,
        transition: theme.transitions.create(['width'], {
            duration: 200,
        }),
    },
    '& .MuiSwitch-track': {
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)',
        boxSizing: 'border-box',
    },
}));

export default Settings