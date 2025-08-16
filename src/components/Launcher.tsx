"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";

import { getVersion } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { transition } from "@/lib/constants";
import { useStateStore as useEngineStore } from "@/state/store";

function Launcher() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const setErrorMessage = useEngineStore((state) => state.setErrorMessage);
  const isErrorMessage = useEngineStore((state) => state.isErrorMessage);
  const isGlobalShortcut = useEngineStore((state) => state.isGlobalShortcut);
  const isNotifications = useEngineStore((state) => state.isNotifications);
  const startLauncher = useEngineStore((state) => state.startLauncher);
  const stopLauncher = useEngineStore((state) => state.stopLauncher);
  const setStarting = useEngineStore((state) => state.setStarting);
  const isStarted = useEngineStore((state) => state.isStarted);
  const isStateDelay = useEngineStore((state) => state.isDelay);
  const isStateMode = useEngineStore((state) => state.isMode);
  const isDarkMode = useEngineStore((state) => state.isDarkMode);

  const [isVersionShow, setVersionShow] = useState(false);
  const [isVersion, setVersion] = useState("");

  useEffect(() => {
    getVersion()
      .then((version) => {
        setVersion(String(version).trim() !== "" ? `v${version}` : "");
      })
      .catch((_err) => {
        setVersion("");
      });

    const handleWatchShortcutStartStopListen = (data: any) => {
      if (!data.payload.isRunning) {
        start(data.isMode, data.isDelay);
      } else {
        stop(data.isMode);
      }
    };

    const watchShortcutStartStopListen = listen(
      "start_stop_event",
      handleWatchShortcutStartStopListen
    );
    return () => {
      watchShortcutStartStopListen.then((f) => f());
    };
  }, []);

  // Version state handler
  useEffect(() => {
    setVersionShow(pathname === "/settings" ? true : false);
  }, [pathname]);

  function start(isMode = null, isDelay = null) {
    setErrorMessage("");

    if (isDelay) {
      if (isDelay <= 0) {
        return setErrorMessage("delay_error");
      }
    } else {
      if (Number(isStateDelay) <= 0) {
        return setErrorMessage("delay_error");

      }
    }

    setStarting(true);

    invoke("start_launcher")
      .then((_res) => {
        startLauncher();

        if (isNotifications) {
          if (isMode && isMode === "withTimer") {
            invoke("show_notification", {
              invokeMessage: JSON.stringify({
                body: t("click_start", {
                  delay: (1000 / Number(isDelay)).toFixed(1),
                }),
              }),
            });
          } else if (isMode && isMode === "withToggle") {
            invoke("show_notification", {
              invokeMessage: JSON.stringify({
                body: t("hold_start"),
              }),
            });
          } else {
            if (isStateMode === "withTimer") {
              invoke("show_notification", {
                invokeMessage: JSON.stringify({
                  body: t("click_start", {
                    delay: (1000 / Number(isStateDelay)).toFixed(1),
                  }),
                }),
              });
            } else if (isStateMode === "withToggle") {
              invoke("show_notification", {
                invokeMessage: JSON.stringify({
                  body: t("hold_start"),
                }),
              });
            }
          }
        }

        setStarting(false);
      })
      .catch((err) => {
        setErrorMessage(String(err));
      });
  }

  function stop(isMode = null) {
    invoke("stop_launcher");
    stopLauncher();
    if (isNotifications) {
      if (isMode && isMode === "withTimer") {
        invoke("show_notification", {
          invokeMessage: JSON.stringify({
            body: t("click_stop"),
          }),
        });
      } else if (isMode && isMode === "withToggle") {
        invoke("show_notification", {
          invokeMessage: JSON.stringify({
            body: t("press_and_hold"),
          }),
        });
      } else {
        if (isStateMode === "withTimer") {
          invoke("show_notification", {
            invokeMessage: JSON.stringify({
              body: t("click_stop"),
            }),
          });
        } else if (isStateMode === "withToggle") {
          invoke("show_notification", {
            invokeMessage: JSON.stringify({
              body: t("press_and_hold"),
            }),
          });
        }
      }
    }
  }

  if (pathname === "/update") {
    return null;
  }

  return (
    <div
      className={`h-16 border-t-2 border-[rgba(0,0,0,0.05)] relative p-6 flex flex-row items-center justify-between shadow-inner ${isDarkMode ? "bg-darkestgray" : "bg-gray-200"
        } duration-150`}
    >
      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
        <button
          onClick={() => (isStarted ? stop() : start())}
          className="select-none outline-none focus:outline-none pl-4 pr-4 pt-2 pb-2 min-w-[100px] flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-gray-200 font-Readex duration-150"
        >
          {isStarted
            ? `${t("stop", {
              keys:
                isGlobalShortcut &&
                String(
                  "(" +
                  String(isGlobalShortcut)
                    .split("+")
                    .map((value) => value.slice(0, 4))
                    .join(" + ") +
                  ")"
                ),
            })}`
            : `${t("start", {
              keys:
                isGlobalShortcut &&
                String(
                  "(" +
                  String(isGlobalShortcut)
                    .split("+")
                    .map((value) => value.slice(0, 4))
                    .join(" + ") +
                  ")"
                ),
            })}`}
        </button>
      </div>

      <div></div>

      <div className="flex items-center justify-center w-1/2 h-1 absolute left-1/2 top-2/3 -translate-y-2/3 -translate-x-1/2">
        <p className="text-red-500 font-Readex text-xs text-center break-words">
          {t(isErrorMessage)}
        </p>
      </div>

      <AnimatePresence>
        {isVersionShow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <p className="font-Readex text-gray-400 text-xs font-bold select-none">
              {isVersion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Launcher;
