"use client";

import * as React from "react";
import { Metadata } from "next";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, ClickAwayListener } from "@mui/material";
import { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

import {
  DownloadIcon,
  SettingsIcon,
  RecordIcon,
  WarningIcon,
} from "@/components/icons";
import CustomCheckbox from "@/components/Checkbox";
import {
  transition,
  convertKeyToReadableFromBackend,
} from "@/lib/constants.js";
import { setMode, setDelay, setKeyType, setKey } from "@/redux/actions";
import useTheme from "@/components/useTheme";
import styles from "@/styles/CSS.module.css";

const DynamicImportedMouseSVG = dynamic(
  () => import("@/components/MouseComponent"),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Clickovski",
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const reduxState = useSelector((state: any) => state);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isListeningKeyboard, setListeningKeyboard] = React.useState(false);
  const [isListenedKeys, setListenedKeys] = React.useState(
    reduxState.isKey ? String(reduxState.isKey).split("+") : []
  );
  const [timeoutListener, setTimeoutListener] =
    React.useState<NodeJS.Timeout | null>(null);

  const KeyboardEventListenerRef = React.useRef<HTMLButtonElement>();

  const [isUpdateState, setUpdateState] = React.useState("Checking");

  React.useEffect(() => {
    const updateState = (event: any) => {
      setUpdateState(event.payload);
    };

    const updateDownloadedData = (event: any) => {
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

  React.useEffect(() => {
    invoke("change_delay", {
      invokeMessage: Number(reduxState.isDelay),
    });
  }, [reduxState.isDelay]);

  React.useEffect(() => {
    invoke("change_mode", {
      invokeMessage: String(reduxState.isMode),
    });
  }, [reduxState.isMode]);

  React.useEffect(() => {
    if (reduxState.isKeyType === "Mouse") {
      setListenedKeys(["Left"]);
      dispatch(setKey("Left"));
    }

    if (reduxState.isKeyType === "Keyboard") {
      setListenedKeys(["C"]);
      dispatch(setKey("C"));
    }
    invoke("change_key_type", {
      invokeMessage: String(reduxState.isKeyType),
    });
  }, [reduxState.isKeyType]);

  React.useEffect(() => {
    invoke("change_key", {
      invokeMessage: convertKeyToReadableFromBackend(reduxState.isKey),
    });
    console.log(convertKeyToReadableFromBackend(reduxState.isKey));
  }, [reduxState.isKey]);

  React.useEffect(() => {
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
            reduxState.isKey ? String(reduxState.isKey).split("+") : []
          );
        }

        if (isListenedKeys.length > 0) {
          let SetRemovedKeys = new Set(removedKeys);
          removedKeys = Array.from(SetRemovedKeys);
          setListenedKeys(removedKeys);
          dispatch(setKey(removedKeys.join("+").trim()));
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

    setTimeoutListener(
      setTimeout(() => {
        setListeningKeyboard(false);
        if (isListenedKeys.length === 0) {
          setListenedKeys(
            reduxState.isKey ? String(reduxState.isKey).split("+") : []
          );
        }
      }, 2000)
    );
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
      className={`max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] flex flex-col p-6 pb-6 ${
        theme ? "bg-darkgray" : "bg-white"
      } duration-150 overflow-x-hidden overflow-y-auto ${
        !theme
          ? `${styles.styledScrollbar} ${styles.backgroundImage}`
          : `${styles.styledScrollbar2} ${styles.backgroundImage2}`
      }`}
    >
      <div className="w-full relative">
        {isUpdateState === "Downloaded" ? (
          <CustomToolTip
            title={t("update_available")}
            disableInteractive
            placement="bottom"
          >
            <motion.button
              className="outline-none focus:outline-none absolute top-0 right-16 opacity-0 p-2"
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
              onClick={RestartAndUpdate}
            >
              <DownloadIcon className="text-green-700" width="18" height="18" />
            </motion.button>
          </CustomToolTip>
        ) : null}

        <CustomToolTip
          title={t("settings")}
          disableInteractive
          placement="bottom"
        >
          <motion.button
            animate={{ right: 0 }}
            className="group p-2 outline-none focus:outline-none absolute top-0 right-0"
            transition={transition}
            onClick={() => router.push("/settings")}
          >
            <SettingsIcon
              className={`${theme ? "text-white" : "text-black"} duration-150`}
              width="18"
              height="18"
            />
          </motion.button>
        </CustomToolTip>
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
              className={`flex flex-row space-x-2 items-center ${
                reduxState.isStarted ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <CustomCheckbox
                onChange={() => dispatch(setKeyType("Mouse"))}
                checked={reduxState.isKeyType === "Mouse"}
                disabled={reduxState.isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${
                  reduxState.isKeyType === "Mouse"
                    ? "opacity-100"
                    : "opacity-50"
                } ${theme ? "text-white" : "text-black"} duration-150`}
              >
                {t("mouse")}
              </p>
            </label>

            <div className="pl-[calc(50%-72px)]">
              {/* <MouseSVG */}
              <DynamicImportedMouseSVG
                theme={theme}
                activeKey={reduxState.isKey}
                isDisabled={reduxState.isKeyType !== "Mouse"}
                isRunning={reduxState.isStarted}
                onPathClick={(key) => {
                  if (
                    reduxState.isKeyType === "Mouse" &&
                    !reduxState.isStarted
                  ) {
                    setListenedKeys([key]);
                    dispatch(setKey(String(key)));
                  }
                }}
              />
            </div>
          </div>

          {/* Keyboard */}
          <div className={`flex flex-col space-y-3 duration-150 w-1/2`}>
            <label
              className={`flex flex-row space-x-2 items-center ${
                reduxState.isStarted /*true */
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <CustomCheckbox
                disabled={/*true */ reduxState.isStarted}
                onChange={() => dispatch(setKeyType("Keyboard"))}
                checked={reduxState.isKeyType === "Keyboard"}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${
                  reduxState.isKeyType === "Keyboard"
                    ? "opacity-100"
                    : "opacity-50"
                } ${theme ? "text-white" : "text-black"} duration-150`}
              >
                {t("keyboard")}
              </p>
            </label>
            {/* </CustomToolTip> */}

            <div className="flex flex-col space-y-2 w-full">
              <ClickAwayListener
                onClickAway={() => setListeningKeyboard(false)}
              >
                <button
                  ref={KeyboardEventListenerRef}
                  disabled={reduxState.isKeyType !== "Keyboard"}
                  onClick={() => setListeningKeyboard((state) => !state)}
                  className={`outline-none flex flex-row justify-between items-center focus:outline-none rounded-md pr-4 pt-1 pb-1 font-Readex ${
                    isListeningKeyboard
                      ? "shadow-[#ff7070]"
                      : "shadow-[#ff707000]"
                  } shadow-[0px_0px_30px_0px] ${
                    reduxState.isKeyType === "Keyboard"
                      ? "opacity-100"
                      : "opacity-50"
                  } ${
                    theme
                      ? "text-white bg-darkestgray"
                      : "text-black bg-gray-200"
                  } duration-150`}
                >
                  <div className="flex flex-row space-x-1 items-center">
                    <p
                      className={`font-Readex font-bold text-base select-none text-opacity-0  ${
                        theme ? "text-white" : "text-black"
                      } duration-150`}
                    >
                      #
                    </p>
                    {isListenedKeys.map((key, i) => (
                      <p
                        key={`keyboard_key_sequence_letter_${i}`}
                        className={`font-Readex font-bold text-sm select-none  ${
                          theme ? "text-white" : "text-black"
                        } duration-150`}
                      >
                        {key} {i !== isListenedKeys.length - 1 && " +"}
                      </p>
                    ))}
                  </div>

                  <span className="relative -top-[calc(50%-4px)] -left-2">
                    {isListeningKeyboard && (
                      <span
                        className={`animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 ${
                          isListeningKeyboard ? "opacity-75" : "opacity-0"
                        } duration-150`}
                      ></span>
                    )}
                    <RecordIcon
                      className={`absolute inline-flex ${
                        theme
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
              <label className="flex flex-row space-x-2 items-center">
                {reduxState.isGlobalShortcut ===
                  isListenedKeys.join("+").trim() && !isListeningKeyboard ? (
                  <>
                    <WarningIcon
                      className={`${
                        theme ? "text-yellow-500" : "text-yellow-600"
                      } select-none`}
                      width={32}
                      height={32}
                    />
                    <p
                      className={`font-Readex font-bold text-xs select-none ${
                        reduxState.isKeyType === "Keyboard"
                          ? "opacity-100"
                          : "opacity-50"
                      } ${
                        theme ? "text-yellow-500" : "text-yellow-600"
                      } duration-150`}
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
                      className={`font-Readex font-bold text-xs select-none ${
                        reduxState.isKeyType === "Keyboard"
                          ? "opacity-100"
                          : "opacity-50"
                      } ${
                        theme
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
          className={`opacity-0 w-full h-[2px] mt-8 ${
            theme ? "bg-[rgba(255,255,255,0.05)]" : "bg-[rgba(0,0,0,0.05)]"
          } rounded-[50px]`}
        ></motion.div>

        <motion.div
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className={`flex flex-col space-y-6 opacity-0`}
        >
          <div className={`flex flex-col space-y-3 duration-150`}>
            <label
              className={`flex flex-row space-x-2 items-center ${
                reduxState.isStarted ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <CustomCheckbox
                onChange={() => dispatch(setMode("withTimer"))}
                checked={reduxState.isMode === "withTimer"}
                disabled={reduxState.isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${
                  reduxState.isMode === "withTimer"
                    ? "opacity-100"
                    : "opacity-50"
                } ${theme ? "text-white" : "text-black"} duration-150`}
              >
                {t("click_with_timer")}
              </p>
            </label>

            <div
              className={`flex flex-col space-y-3 items-center ${
                reduxState.isMode === "withTimer" ? "opacity-100" : "opacity-50"
              } duration-150`}
            >
              <div className="flex flex-row space-x-3 items-center">
                <input
                  type="number"
                  name="withTimerDelay"
                  min={10}
                  value={reduxState.isDelay}
                  disabled={reduxState.isStarted || reduxState.isStarting}
                  onChange={(e) => {
                    if (Number(e.target.value) <= 0) {
                      dispatch(setDelay(1));
                    } else {
                      dispatch(setDelay(Number(e.target.value)));
                    }
                  }}
                  className={`${
                    reduxState.isStarted ? "cursor-not-allowed" : "cursor-text"
                  } ${
                    styles.number_input
                  } appearance-none outline-none focus:outline-none rounded-md pl-2 pt-1 pb-1 font-Readex ${
                    theme
                      ? "text-white bg-darkestgray shadow-xl"
                      : "text-black bg-gray-200 shadow"
                  } duration-150`}
                />
                <p
                  className={`font-Readex text-sm select-none ${
                    theme ? "text-white" : "text-black"
                  } duration-150`}
                >
                  {t("millis")}{" "}
                  <a
                    className={`${
                      theme ? "text-gray-400" : "text-gray-900"
                    } duration-150`}
                  >
                    (1 {t("second").toLowerCase()} = 1000 ms)
                  </a>
                </p>
              </div>

              <p
                className={`font-Readex text-sm select-none ${
                  theme ? "text-white" : "text-black"
                } duration-150`}
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
              className={`flex flex-row space-x-2 items-center ${
                reduxState.isStarted ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <CustomCheckbox
                onChange={() => dispatch(setMode("withToggle"))}
                checked={reduxState.isMode === "withToggle"}
                disabled={reduxState.isStarted}
              />
              <p
                className={`font-Readex font-bold text-base select-none ${
                  reduxState.isMode === "withToggle"
                    ? "opacity-100"
                    : "opacity-50"
                } ${theme ? "text-white" : "text-black"} duration-150`}
              >
                {t("hold_key")}
              </p>
            </label>

            <div
              className={`flex flex-row items-center ${
                reduxState.isMode === "withToggle"
                  ? "opacity-100"
                  : "opacity-50"
              } duration-150`}
            >
              <div className="flex flex-row items-center">
                <p
                  className={`font-Readex text-sm select-none ${
                    theme ? "text-white" : "text-black"
                  } duration-150`}
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

const CustomToolTip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "rgb(16,14,14)",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "rgb(16,14,14)",
    padding: 8,
    color: "rgb(229,231,235)",
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "Readex Pro, sans-serif",
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
}));

export default Home;
