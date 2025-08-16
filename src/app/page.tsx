"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import {
  DownloadIcon,
  SettingsIcon,
  RecordIcon,
  WarningIcon,
} from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox"
import {
  transition,
  convertKeyToReadableFromBackend,
} from "@/lib/constants";
import { useStateStore as useEngineStore } from "@/state/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ClickAwayListener } from "@/components/ClickAwayListener";
import styles from "@/styles/CSS.module.css";

const DynamicImportedMouseSVG = dynamic(
  () => import("@/components/MouseComponent"),
  { ssr: false }
);

const appWindow = getCurrentWindow();

const Home = () => {
  const { t } = useTranslation();

  const isKey = useEngineStore((state) => state.isKey);
  const setKey = useEngineStore((state) => state.setKey);
  const isKeyType = useEngineStore((state) => state.isKeyType);
  const setKeyType = useEngineStore((state) => state.setKeyType);
  const isStarting = useEngineStore((state) => state.isStarting);
  const isStarted = useEngineStore((state) => state.isStarted);
  const isGlobalShortcut = useEngineStore((state) => state.isGlobalShortcut);
  const isMode = useEngineStore((state) => state.isMode);
  const setMode = useEngineStore((state) => state.setMode);
  const isDelay = useEngineStore((state) => state.isDelay);
  const setDelay = useEngineStore((state) => state.setDelay);
  const isDarkMode = useEngineStore((state) => state.isDarkMode);

  const [isListeningKeyboard, setListeningKeyboard] = useState(false);
  const [isListenedKeys, setListenedKeys] = useState(
    isKey ? String(isKey).split("+") : []
  );
  const [timeoutListener, setTimeoutListener] =
    useState<NodeJS.Timeout | null>(null);

  const KeyboardEventListenerRef = useRef<HTMLButtonElement>(null);

  const [isUpdateState, setUpdateState] = useState("Checking");

  useEffect(() => {
    const updateState = (event: any) => {
      setUpdateState(event.payload);
    };

    const updateDownloadedData = (_event: any) => {
      // setUpdateProgress((updateProgress) => {
      //   return { ...updateProgress, percent: 0 };
      // });
      // setUpdateInfo(event.payload);
    };

    const updateStateListen = listen("updateState", updateState);
    const updateDownloadedDataListen = listen(
      "updateDownloadedData",
      updateDownloadedData
    );


    appWindow.setTitle("Clickovski");
    return () => {
      updateStateListen.then((f) => f());
      updateDownloadedDataListen.then((f) => f());
    };
  }, []);

  useEffect(() => {
    invoke("change_delay", {
      invokeMessage: Number(isDelay),
    });
  }, [isDelay]);

  useEffect(() => {
    invoke("change_mode", {
      invokeMessage: String(isMode),
    });
  }, [isMode]);

  useEffect(() => {
    if (isKeyType === "Mouse") {
      setListenedKeys(["Left"]);
      setKey("Left");
    }

    if (isKeyType === "Keyboard") {
      setListenedKeys(["C"]);
      setKey("C");
    }
    console.log("KeyType changed to: ", isKeyType);
    invoke("change_key_type", {
      invokeMessage: String(isKeyType),
    });
  }, [isKeyType]);

  useEffect(() => {
    invoke("change_key", {
      invokeMessage: convertKeyToReadableFromBackend(isKey),
    });
    console.log(convertKeyToReadableFromBackend(isKey));
  }, [isKey]);

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
        let removedKeys: string[] | Set<string> = isListenedKeys;
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
            isKey ? String(isKey).split("+") : []
          );
        }

        if (isListenedKeys.length > 0) {
          let SetRemovedKeys = new Set(removedKeys);
          removedKeys = Array.from(SetRemovedKeys);
          setListenedKeys(removedKeys);
          setKey(removedKeys.join("+").trim());
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
            isKey ? String(isKey).split("+") : []
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

  function RestartAndUpdate() {
    emit("updateRequest", true);
  }

  function KeyboardEventListenerFunction(e: KeyboardEvent) {
    // console.log(e.key)
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
      className={`max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] flex flex-col p-6 pb-6 
        dark:bg-darkgray bg-white duration-150 overflow-x-hidden overflow-y-auto
        ${!isDarkMode
          ? `${styles.styledScrollbar} ${styles.backgroundImage}`
          : `${styles.styledScrollbar2} ${styles.backgroundImage2}`
        }`}
    >
      <div className="w-full relative">
        {isUpdateState === "Downloaded" ? (
          <motion.div
            className="outline-none focus:outline-none absolute top-0 right-16 opacity-0 p-2"
            exit={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={RestartAndUpdate}>
                  <DownloadIcon className="text-green-700" width="18" height="18" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-darkgray dark:bg-[#e5e5e5] dark:text-black text-white p-2 font-Readex shadow text-xs"
              >
                <p>{t("update_available")}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ) : null}

        <motion.div
          animate={{ right: 0, rotate: 360 }}
          className="group p-2 outline-none focus:outline-none absolute top-0 right-0"
          transition={transition}
          layoutId="settings-button"
        >
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={"/settings"}>
                <SettingsIcon
                  className={`dark:text-white text-black duration-150`}
                  width="18"
                  height="18"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-darkgray dark:bg-[#e5e5e5] dark:text-black text-white p-2 font-Readex shadow text-xs"
            >
              <p>{t("settings")}</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      </div>

      <div className="h-full w-full flex flex-col space-y-8">
        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className={`flex flex-row justify-between pt-4 opacity-0 w-full mt-2`}
        >
          {/* Mouse */}
          <div className={`flex flex-col space-y-3 duration-150 w-1/2`}>
            <label
              className={`flex flex-row space-x-2 items-center ${isStarted ? "cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <Checkbox
                onCheckedChange={() => setKeyType("Mouse")}
                checked={isKeyType === "Mouse"}
                disabled={isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${isKeyType === "Mouse"
                  ? "opacity-100"
                  : "opacity-50"
                  } dark:text-white text-black duration-150`}
              >
                {t("mouse")}
              </p>
            </label>

            <div className="pl-[calc(50%-72px)]">
              {/* <MouseSVG */}
              <DynamicImportedMouseSVG
                theme={isDarkMode ?? false}
                activeKey={isKey}
                isDisabled={isKeyType !== "Mouse"}
                isRunning={isStarted}
                onPathClick={(key) => {
                  if (
                    isKeyType === "Mouse" &&
                    !isStarted
                  ) {
                    setListenedKeys([key]);
                    setKey(String(key));
                  }
                }}
              />
            </div>
          </div>

          {/* Keyboard */}
          <div className={`flex flex-col space-y-3 duration-150 w-1/2`}>
            <label
              className={`flex flex-row space-x-2 items-center ${isStarted /*true */
                ? "cursor-not-allowed"
                : "cursor-pointer"
                }`}
            >
              <Checkbox
                disabled={/*true */ isStarted}
                onCheckedChange={() => setKeyType("Keyboard")}
                checked={isKeyType === "Keyboard"}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${isKeyType === "Keyboard"
                  ? "opacity-100"
                  : "opacity-50"
                  } dark:text-white text-black duration-150`}
              >
                {t("keyboard")}
              </p>
            </label>

            <div className="flex flex-col space-y-2 w-full">
              <ClickAwayListener
                onClickAway={() => setListeningKeyboard(false)}
              >
                <button
                  ref={KeyboardEventListenerRef}
                  disabled={isKeyType !== "Keyboard"}
                  onClick={() => setListeningKeyboard((state) => !state)}
                  className={`outline-none flex flex-row justify-between items-center focus:outline-none rounded-md pr-4 pt-1 pb-1 font-Readex ${isListeningKeyboard
                    ? "shadow-[#ff7070]"
                    : "shadow-[#ff707000]"
                    } shadow-[0px_0px_30px_0px] ${isKeyType === "Keyboard"
                      ? "opacity-100"
                      : "opacity-50"
                    } 
                    dark:text-white dark:bg-darkestgray
                    text-black bg-gray-200
                    duration-150`}
                >
                  <div className="flex flex-row space-x-1 items-center">
                    <p
                      className={`font-Readex font-bold text-base select-none opacity-0  dark:text-white text-black duration-150`}
                    >
                      #
                    </p>
                    {isListenedKeys.map((key, i) => (
                      <p
                        key={`keyboard_key_sequence_letter_${i}`}
                        className={`font-Readex font-bold text-sm select-none  dark:text-white text-black duration-150`}
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
                          ? "dark:text-red-500"
                          : "dark:text-gray-500"
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
              <label className="flex flex-row space-x-2 items-center">
                {isGlobalShortcut ===
                  isListenedKeys.join("+").trim() && !isListeningKeyboard ? (
                  <>
                    <WarningIcon
                      className={`dark:text-yellow-500 text-yellow-600 select-none`}
                      width={32}
                      height={32}
                    />
                    <p
                      className={`font-Readex font-bold text-xs select-none ${isKeyType === "Keyboard"
                        ? "opacity-100"
                        : "opacity-50"
                        } dark:text-yellow-500 text-yellow-600 duration-150`}
                    >
                      {t("keyboard_press_same_as_hotkey")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-Readex font-bold text-xs select-none text-opacity-0 opacity-0">
                      #
                    </p>
                    <p
                      className={`font-Readex font-bold text-xs select-none ${isKeyType === "Keyboard"
                        ? "opacity-100"
                        : "opacity-50"
                        } ${isDarkMode
                          ? isListeningKeyboard
                            ? "text-blue-500"
                            : "text-gray-400"
                          : isListeningKeyboard
                            ? "text-blue-500"
                            : "text-gray-400"
                        } duration-150`}
                    >
                      {isListeningKeyboard
                        ? `${t("buttons")} ${t("recording")}`
                        : ""}
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className={`opacity-0 w-full h-[2px] mt-8 dark:bg-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.05)] rounded-[50px]`}
        ></motion.div>

        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className={`flex flex-col space-y-6 opacity-0`}
        >
          <div className={`flex flex-col space-y-3 duration-150`}>
            <label
              className={`flex flex-row space-x-2 items-center ${isStarted ? "cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <Checkbox
                onCheckedChange={() => setMode("withTimer")}
                checked={isMode === "withTimer"}
                disabled={isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${isMode === "withTimer"
                  ? "opacity-100"
                  : "opacity-50"
                  } dark:text-white text-black duration-150`}
              >
                {t("click_with_timer")}
              </p>
            </label>

            <div
              className={`flex flex-col space-y-3 items-center ${isMode === "withTimer" ? "opacity-100" : "opacity-50"
                } duration-150`}
            >
              <div className="flex flex-row space-x-3 items-center">
                <input
                  type="number"
                  name="withTimerDelay"
                  min={1}
                  value={isDelay}
                  disabled={isStarted || isStarting}
                  onChange={(e) => {
                    if (Number(e.target.value) <= 0) {
                      setDelay(1);
                    } else {
                      setDelay(Number(e.target.value));
                    }
                  }}
                  className={`${isStarted ? "cursor-not-allowed" : "cursor-text"
                    } ${styles.number_input
                    } appearance-none outline-none focus:outline-none rounded-md pl-2 pt-1 pb-1 font-Readex 
                    dark:text-white dark:bg-darkestgray dark:shadow-xl
                    text-black bg-gray-200 shadow duration-150
                    `}
                />
                <p
                  className={`font-Readex text-sm select-none dark:text-white text-black duration-150`}
                >
                  {t("millis")}{" "}
                  <a
                    className={`dark:text-gray-400 text-gray-900 duration-150`}
                  >
                    (1 {t("second").toLowerCase()} = 1000 ms)
                  </a>
                </p>
              </div>

              <p
                className={`font-Readex text-sm select-none dark:text-white text-black duration-150`}
              >
                {t("click_key_expl_text")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className={`flex flex-col space-y-6 opacity-0`}
        >
          <div className={`flex flex-col space-y-3 duration-150`}>
            <label
              className={`flex flex-row space-x-2 items-center ${isStarted ? "cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <Checkbox
                onCheckedChange={() => setMode("withToggle")}
                checked={isMode === "withToggle"}
                disabled={isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${isMode === "withToggle"
                  ? "opacity-100"
                  : "opacity-50"
                  } dark:text-white text-black duration-150`}
              >
                {t("hold_key")}
              </p>
            </label>

            <div
              className={`flex flex-row items-center ${isMode === "withToggle"
                ? "opacity-100"
                : "opacity-50"
                } duration-150`}
            >
              <div className="flex flex-row items-center">
                <p
                  className={`font-Readex text-sm select-none dark:text-white text-black duration-150`}
                >
                  {t("hold_key_expl_text")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
