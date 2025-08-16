"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { enable as autoStartEnable, isEnabled as isAutoStartEnabled, disable as autoStartDisable } from '@tauri-apps/plugin-autostart';

import { RightIcon, SettingsIcon, RecordIcon } from "@/components/icons";
import { transition } from "@/lib/constants";
import Flags from "@/components/Flags";
import { useStateStore as useEngineStore } from "@/state/store";
import { ClickAwayListener } from "@/components/ClickAwayListener";
import { Switch } from "@/components/ui/switch"

import styles from "@/styles/CSS.module.css";
import Link from "next/link";

const appWindow = getCurrentWindow();

function Settings() {
  const { t, i18n } = useTranslation();

  const isNotifications = useEngineStore((state) => state.isNotifications);
  const setNotifications = useEngineStore((state) => state.setNotifications);
  const isStartUp = useEngineStore((state) => state.isStartUp);
  const setStartUp = useEngineStore((state) => state.setStartUp);
  const isLanguage = useEngineStore((state) => state.isLanguage);
  const setLanguage = useEngineStore((state) => state.setLanguage);
  const setDarkMode = useEngineStore((state) => state.setDarkMode);
  const isDarkMode = useEngineStore((state) => state.isDarkMode);
  const isGlobalShortcut = useEngineStore((state) => state.isGlobalShortcut);
  const setGlobalShortcut = useEngineStore((state) => state.setGlobalShortcut);

  const KeyboardEventListenerRef = useRef<HTMLButtonElement>(null);
  const [isLanguageOpen, setLanguageOpen] = useState(false);
  const [isListeningKeyboard, setListeningKeyboard] = useState(false);
  const [isListenedKeys, setListenedKeys] = useState<string[]>([]);
  const [timeoutListener, setTimeoutListener] = useState<NodeJS.Timeout | null>(null);

  const setLanguageFunction = async (item: any) => {
    setLanguage(item.name);
    await i18n.changeLanguage(item.name);
    appWindow.setTitle(`Clickovski - ${t("settings")}`);
    setLanguageOpen(!isLanguageOpen);
  };

  const setNotificationsFunc = () => {
    setNotifications(!isNotifications);
  };

  const setStartUpFunc = async () => {
    if (await isAutoStartEnabled()) {
      await autoStartDisable();
      setStartUp(false);
    } else {
      await autoStartEnable();
      setStartUp(true);
    }
  };

  const setDarkModeFunc = () => {
    if (!isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem("darkMode", !isDarkMode ? "dark" : "light");
    setDarkMode(!isDarkMode);
  };

  useEffect(() => {
    appWindow.setTitle(`Clickovski - ${t("settings")}`);

    // Check if auto start is enabled on startup
    (async () => {
      setStartUp(await isAutoStartEnabled());
    })();
  }, []);

  useEffect(() => {
    if (isGlobalShortcut) {
      setListenedKeys(String(isGlobalShortcut).split("+"));
    } else {
      setListenedKeys([]);
    }
  }, [isGlobalShortcut]);

  // Global Shortcuts functions
  useEffect(() => {
    if (KeyboardEventListenerRef && KeyboardEventListenerRef.current) {
      if (isListeningKeyboard) {
        if (timeoutListener) {
          clearTimeout(timeoutListener);
        }
        setTimeoutListener(null);

        setListenedKeys([]);
        KeyboardEventListenerRef.current.onkeydown = (e) =>
          KeyboardEventListenerFunction(e);
      } else {
        // remove everything after 3rd character
        let removedKeys = isListenedKeys;
        if (isListenedKeys.length > 3) {
          setListenedKeys((keys) => [keys[0], keys[1], keys[2]]);
          removedKeys = [
            isListenedKeys[0],
            isListenedKeys[1],
            isListenedKeys[2],
          ];
        }

        if (timeoutListener) {
          clearTimeout(timeoutListener);
        }
        setTimeoutListener(null);

        if (isListenedKeys.length === 0) {
          setListenedKeys(
            isGlobalShortcut
              ? String(isGlobalShortcut).split("+")
              : []
          );
        }

        if (isListenedKeys.length > 0) {
          // console.log("push to backend", removedKeys)
          let SetRemovedKeys = new Set(removedKeys);
          removedKeys = Array.from(SetRemovedKeys);
          setListenedKeys(removedKeys);
          setGlobalShortcut(removedKeys.join("+").trim());
        }
        KeyboardEventListenerRef.current.onkeydown = null;
      }
    }
  }, [isListeningKeyboard]);

  useEffect(() => {
    if (timeoutListener) {
      clearTimeout(timeoutListener);
    }
    setTimeoutListener(null);

    setTimeoutListener(
      setTimeout(() => {
        setListeningKeyboard(false);
        if (isListenedKeys.length === 0) {
          setListenedKeys(
            isGlobalShortcut
              ? String(isGlobalShortcut).split("+")
              : []
          );
        }
      }, 2000)
    );
  }, [isListenedKeys]);

  useEffect(() => {
    if (isListenedKeys.length >= 3) {
      setListeningKeyboard(false);

      if (timeoutListener) {
        clearTimeout(timeoutListener);
      }
      setTimeoutListener(null);
    }
  }, [isListenedKeys]);

  function KeyboardEventListenerFunction(e: KeyboardEvent) {
    e.preventDefault();
    if (String(e.key).trim() === "") {
      setListenedKeys((keys) => [...keys, "Space"]);
    } else if (String(e.key).trim() === "+") {
      setListenedKeys((keys) => [...keys, "Plus"]);
    } else if (
      ["Home", "NumLock", "ScrollLock", "Pause", "Insert"].includes(
        String(e.key).trim()
      )
    ) {
      // Do nothing they are not supported keys in rust package enigo@0.0.14
    } else {
      setListenedKeys((keys) => [
        ...keys,
        String(
          String(e.key).charAt(0).toUpperCase() + String(e.key).slice(1)
        ).trim(),
      ]);
    }
  }

  return (
    <div
      className={`max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] p-6 pb-12 overflow-hidden ${isDarkMode ? "bg-darkgray" : "bg-white"
        } duration-150 overflow-x-hidden overflow-y-auto ${!isDarkMode
          ? `${styles.styledScrollbar} ${styles.backgroundImage}`
          : `${styles.styledScrollbar2} ${styles.backgroundImage2}`
        }`}
    >
      <div className="w-full relative h-full">
        <motion.button
          exit={{ left: "0px" }}
          animate={{ rotate: 360 }}
          layoutId="settings-button"
          className="group p-2 outline-none focus:outline-none opacity-100 absolute top-0 left-0 cursor-default"
          transition={transition}
          onClick={() => { }}
        >
          <SettingsIcon
            className={`${isDarkMode ? "text-white" : "text-black"} duration-150`}
            width="18"
            height="18"
          />
        </motion.button>

        <motion.p
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ...transition, delay: 0.3 }}
          className={`font-Readex font-bold opacity-0 left-8 top-0 absolute p-1 select-none ${isDarkMode ? "text-white" : "text-black"
            } duration-150`}
        >
          {t("settings")}
        </motion.p>

        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="opacity-0 absolute right-0 top-0 p-2 outline-none focus:outline-none"
        >
          <Link href={"/"}>

            <RightIcon
              className={`${isDarkMode ? "text-white" : "text-black"
                } duration-150`}
              width="16"
              height="16"
            />
          </Link>
        </motion.div>
      </div>

      <motion.div
        exit={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition}
        className={`opacity-0 border-t-2 ${isDarkMode
          ? "border-[rgba(255,255,255,0.05)]"
          : "border-[rgba(0,0,0,0.05)]"
          } mt-12 flex flex-col space-y-6 pt-4 w-full h-full`}
      >
        <div className="flex flex-col space-y-6">
          <p
            className={`font-Readex text-base select-none ${isDarkMode ? "text-white" : "text-black"
              } duration-150`}
          >
            {t("general")}
          </p>
          <div className="flex flex-col space-y-5 pl-2 pr-2">
            <label className="flex flex-row justify-between items-center cursor-pointer">
              <p
                className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"} duration-150`}
              >
                {t("start_up")}
              </p>
              <Switch
                onClick={() => setStartUpFunc()}
                checked={isStartUp}
              />
            </label>
            <label className="flex flex-row justify-between items-center cursor-pointer">
              <p
                className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"
                  } duration-150`}
              >
                {t("show_notifications")}
              </p>
              <Switch
                onClick={() => setNotificationsFunc()}
                checked={isNotifications}
              />
            </label>
            <label className="flex flex-row justify-between items-center cursor-pointer">
              <p
                className={`font-Readex text-sm select-none cursor-pointer ${isDarkMode ? "text-white" : "text-black"
                  } duration-150`}
              >
                {t("dark_mode")}
              </p>
              <Switch
                onClick={() => setDarkModeFunc()}
                checked={isDarkMode ?? false}
              />
            </label>

            <div className="flex flex-row justify-between ">
              <p
                className={`font-Readex text-sm select-none ${isDarkMode ? "text-white" : "text-black"
                  } duration-150`}
              >
                {t("shortcut_key")}
              </p>
              <ClickAwayListener
                onClickAway={() => setListeningKeyboard(false)}
              >
                <button
                  ref={KeyboardEventListenerRef}
                  onClick={() => setListeningKeyboard((state) => !state)}
                  className={`outline-none flex flex-row overflow-hidden justify-between items-center relative focus:outline-none w-1/2 rounded-md pr-4 pt-1 pb-1 font-Readex ${isListeningKeyboard
                    ? "shadow-[#ff7070]"
                    : "shadow-[#ff707000]"
                    } shadow-[0px_0px_30px_0px]  ${isDarkMode
                      ? "text-white bg-darkestgray"
                      : "text-black bg-gray-200"
                    } duration-150`}
                >
                  <div className="flex flex-row space-x-1 items-center w-full">
                    <p
                      className={`font-Readex font-bold text-base select-none opacity-0  ${isDarkMode ? "text-white" : "text-black"
                        } duration-150`}
                    >
                      #
                    </p>
                    {(isListeningKeyboard && isListenedKeys.length == 0 ? [] : isListenedKeys.length == 0 ? String(isGlobalShortcut).split("+") : isListenedKeys).map((key, i) => (
                      <p
                        key={`keyboard_key_sequence_global_shortcut_letter_${i}`}
                        className={`font-Readex font-bold text-sm select-none  ${isDarkMode ? "text-white" : "text-black"
                          } duration-150`}
                      >
                        {key} {i !== isListenedKeys.length - 1 && " +"}
                      </p>
                    ))}
                  </div>

                  <span className="relative -top-[calc(50%-4px)] -left-2">
                    {isListeningKeyboard && (
                      <span
                        className={`animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 ${isListeningKeyboard ? "opacity-75" : "opacity-0"
                          } duration-150`}
                      ></span>
                    )}
                    <RecordIcon
                      className={`absolute inline-flex ${isDarkMode
                        ? isListeningKeyboard
                          ? "text-red-500"
                          : "text-gray-500"
                        : isListeningKeyboard
                          ? "text-red-500"
                          : "text-gray-400"
                        } duration-150`}
                      width="16"
                      height="16"
                    />
                  </span>
                </button>
              </ClickAwayListener>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <p
            className={`font-Readex text-base select-none ${isDarkMode ? "text-white" : "text-black"
              } duration-150`}
          >
            {t("language")}
          </p>
          <ClickAwayListener onClickAway={() => setLanguageOpen(false)}>
            <div className="relative flex md:max-w-[50%] lg:max-w-[60%] max-w-[100%]">
              <button
                onClick={() => setLanguageOpen(!isLanguageOpen)}
                className={`relative border border-transparent w-full flex flex-row space-x-3 items-center p-3 ${isDarkMode ? "bg-darkestgray shadow-xl" : "bg-gray-200 shadow"
                  } rounded-lg outline-none focus:outline-none duration-150`}
              >
                <Flags
                  language={isLanguage}
                  className="w-[18px] h-[18px] rounded"
                />
                <p
                  className={`font-Readex select-none ${isDarkMode ? "text-white" : "text-black"
                    } duration-150`}
                >
                  {isLanguage}
                </p>
                <motion.div
                  animate={isLanguageOpen ? { rotate: 90 } : { rotate: -90 }}
                  className="absolute right-4"
                >
                  <RightIcon
                    className={`${isDarkMode ? "text-white" : "text-black"
                      } duration-150`}
                    width="12"
                    height="12"
                  />
                </motion.div>
              </button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, top: 40 }}
                    animate={{ opacity: 1, top: 54 }}
                    exit={{ opacity: 0, top: 40 }}
                    transition={{ type: "spring", duration: 0.2 }}
                    className={`w-full p-3 absolute ${isDarkMode
                      ? "bg-darkestgray shadow-xl"
                      : "bg-gray-200 shadow-lg"
                      } rounded-lg outline-none focus:outline-none max-h-64 overflow-x-hidden overflow-y-auto ${styles.styledScrollbar
                      }`}
                  >
                    {[{ name: "English" }, { name: "Türkçe" }].map(
                      (item, i) => (
                        <button
                          onClick={() => setLanguageFunction(item)}
                          key={`language_item_${i}`}
                          className={`p-2 flex w-full ${isDarkMode
                            ? "hover:bg-blue-600"
                            : "hover:bg-blue-200"
                            } flex-row space-x-3 items-center rounded focus:outline-none outline-none`}
                        >
                          <Flags
                            language={item.name}
                            className="w-[18px] h-[18px] rounded"
                          />
                          <p
                            className={`${isDarkMode ? "text-white" : "text-black"
                              } duration-150 font-Readex select-none`}
                          >
                            {item.name}
                          </p>
                        </button>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ClickAwayListener>
        </div>
      </motion.div>
    </div>
  );
}

export default Settings;
