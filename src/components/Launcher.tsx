"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
const { motion, AnimatePresence } = require("framer-motion");
import { useDispatch, useSelector } from "react-redux";
import { emit, listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import {
  register,
  unregister,
  unregisterAll,
  isRegistered,
} from "@tauri-apps/api/globalShortcut";
import { invoke } from "@tauri-apps/api/tauri";
import { useTranslation } from "react-i18next";
import localforage from "localforage";

import {
  Action,
  startLauncher,
  stopLauncher,
  setStarting,
  setErrorMessage,
} from "../redux/actions";
import useTheme from "../components/useTheme";
import { defaultStoreData, transition } from "../lib/constants";

function Launcher() {
  const { t, i18n } = useTranslation();

  const router = useRouter();
  const pathname = usePathname();

  const reduxState = useSelector((state: any) => state);
  const theme = useTheme();
  const dispatch = useDispatch();

  const [isVersionShow, setVersionShow] = React.useState(false);
  const [isVersion, setVersion] = React.useState("");
  const [isGlobalShortcutRegistered, setGlobalShortcutRegistered] =
    React.useState(false);

  React.useEffect(() => {
    getVersion()
      .then((version) => {
        setVersion(String(version).trim() !== "" ? `v${version}` : "");
      })
      .catch((error) => {
        setVersion("");
      });

    const handleWatchShortcutStartStopListen = (data: any) => {
      if (!data.payload.isRunning) {
        start(data.isMode, data.isDelay);
      } else {
        stop(data.isMode);
      }
    };

    const handleWatchSetShortcutEmitter = (data: any) => {
      setGlobalShortcutRegistered(true);
      localforage.getItem("settings").then(async (res: any) => {
        //register for shortcuts
        let globalShortcut =
          JSON.parse(res || "{}").isShortcut || defaultStoreData.isShortcut;
        unregisterAll().then((res1) => {
          // not registered yet
          // alert("unregister #1");
          console.log("unregister #1");
          register(globalShortcut, (globalShortcut1) => {
            invoke("start_stop_global_shortcut_pressed", {
              invokeMessage: true,
            });
          })
            .then(() => {
              console.log("registered #1");
            })
            .catch((err) => {
              console.log("cant registered trying one more time #1");

              unregister(globalShortcut)
                .then((res2) => {
                  // alert("unregister #2");
                  console.log("unregister #2");

                  register(globalShortcut, (globalShortcut2) => {
                    invoke("start_stop_global_shortcut_pressed", {
                      invokeMessage: true,
                    });
                  }).catch((err) => {
                    // alert("cant registered #2");
                    console.log("cant registered #2");
                  });
                })
                .then(() => {
                  console.log("registered #2");
                })
                .catch((err) => {
                  console.log("unregister catch error #2");
                });
            });
        });
      });
    };

    const watchShortcutStartStopListen = listen(
      "start_stop_event",
      handleWatchShortcutStartStopListen
    );
    const watchSetShortcutEmitter = listen(
      "global_shortcut_register",
      handleWatchSetShortcutEmitter
    );
    return () => {
      watchShortcutStartStopListen.then((f) => f());
      watchSetShortcutEmitter.then((f) => f());
    };
  }, []);

  //Global shortcut watcher
  React.useEffect(() => {
    localforage.getItem("settings").then((res) => {
      // unregister previous shortcut
      if (JSON.parse(String(res))?.isShortcut) {
        let globalShortcut = JSON.parse(String(res)).isShortcut;
        isRegistered(globalShortcut).then((res1) => {
          if (res1) {
            // not registered yet
            unregister(globalShortcut);
          }
        });
      }

      // set new shortcut to localforage
      localforage.setItem(
        "settings",
        JSON.stringify({
          ...JSON.parse(String(res)),
          isShortcut: reduxState.isGlobalShortcut,
        })
      );

      // register new shortcut
      isRegistered(reduxState.isGlobalShortcut).then((res1) => {
        if (!res1) {
          // not registered yet
          // console.log("registering")
          register(reduxState.isGlobalShortcut, (globalShortcut) => {
            invoke("start_stop_global_shortcut_pressed", {
              invokeMessage: true,
            });
          });
        }
      });
    });
  }, [reduxState.isGlobalShortcut]);

  // Version state handler
  React.useEffect(() => {
    setVersionShow(pathname === "/settings" ? true : false);
  }, [pathname]);

  function start(isMode = null, isDelay = null) {
    dispatch<Action>(setErrorMessage(""));

    if (isDelay) {
      if (isDelay <= 0) {
        return dispatch<Action>(setErrorMessage("delay_error"));
      }
    } else {
      if (Number(reduxState.isDelay) <= 0) {
        return dispatch<Action>(setErrorMessage("delay_error"));
      }
    }

    dispatch<Action>(setStarting(true));

    invoke("start_launcher")
      .then((res) => {
        dispatch<Action>(startLauncher());

        localforage.getItem("settings").then((res) => {
          if (JSON.parse(String(res))?.isNotifications) {
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
              if (reduxState.isMode === "withTimer") {
                invoke("show_notification", {
                  invokeMessage: JSON.stringify({
                    body: t("click_start", {
                      delay: (1000 / Number(reduxState.isDelay)).toFixed(1),
                    }),
                  }),
                });
              } else if (reduxState.isMode === "withToggle") {
                invoke("show_notification", {
                  invokeMessage: JSON.stringify({
                    body: t("hold_start"),
                  }),
                });
              }
            }
          }
        });
        dispatch(setStarting(false));
      })
      .catch((err) => {
        dispatch<Action>(setErrorMessage(err));
      });
  }

  function stop(isMode = null) {
    invoke("stop_launcher");
    dispatch<Action>(stopLauncher());
    localforage.getItem("settings").then((res) => {
      if (JSON.parse(String(res))?.isNotifications) {
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
          if (reduxState.isMode === "withTimer") {
            invoke("show_notification", {
              invokeMessage: JSON.stringify({
                body: t("click_stop"),
              }),
            });
          } else if (reduxState.isMode === "withToggle") {
            invoke("show_notification", {
              invokeMessage: JSON.stringify({
                body: t("press_and_hold"),
              }),
            });
          }
        }
      }
    });
  }

  if (pathname === "/update") {
    return null;
  }

  return (
    <div
      className={`h-16 border-t-2 border-[rgba(0,0,0,0.05)] relative p-6 flex flex-row items-center justify-between shadow-inner ${
        theme ? "bg-darkestgray" : "bg-gray-200"
      } duration-150`}
    >
      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
        <button
          onClick={() => (reduxState.isStarted ? stop() : start())}
          className="select-none outline-none focus:outline-none pl-4 pr-4 pt-2 pb-2 min-w-[100px] flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-gray-200 font-Readex duration-150"
        >
          {reduxState.isStarted
            ? `${t("stop", {
                keys:
                  reduxState.isGlobalShortcut &&
                  String(
                    "(" +
                      String(reduxState.isGlobalShortcut)
                        .split("+")
                        .map((value) => value.slice(0, 4))
                        .join(" + ") +
                      ")"
                  ),
              })}`
            : `${t("start", {
                keys:
                  reduxState.isGlobalShortcut &&
                  String(
                    "(" +
                      String(reduxState.isGlobalShortcut)
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
          {t(reduxState.isErrorMessage)}
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
