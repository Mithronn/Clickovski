"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from "@tauri-apps/api/core";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface IUpdateInfo {
  releaseDate: string | undefined;
  version: string | undefined;
}

function Update() {
  const { t } = useTranslation();
  const [isUpdateState, setUpdateState] = useState("Checking");
  const [isUpdateInfo, setUpdateInfo] = useState<IUpdateInfo>();

  useEffect(() => {
    (async () => {
      // Hide update window on mount to prevent white screen
      invoke("open_updater_on_mount");
      try {
        const update = await check();
        if (!update) {
          invoke("global_shortcut_register", { invokeMessage: true });
          return invoke("close_updater_and_open_main");
        }
        if (update) {
          setUpdateInfo({
            releaseDate: update?.date,
            version: update?.version,
          });

          setUpdateState("Downloading");

          let downloaded = 0;
          let contentLength = 0;
          // alternatively we could also call update.download() and update.install() separately
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength || 0;
                console.log(`started downloading ${event.data.contentLength} bytes`);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength;
                console.log(`downloaded ${downloaded} from ${contentLength}`);
                break;
              case 'Finished':
                console.log('download finished');
                break;
            }
          });

          console.log('update installed');
          await relaunch();
        }
      } catch (error) {
        console.log(error);
        invoke("global_shortcut_register", { invokeMessage: true });
        return invoke("close_updater_and_open_main");
      }
    })();
  }, []);

  return (
    <div
      data-tauri-drag-region
      className={`w-full min-h-screen flex items-center justify-center flex-col space-y-6 dark:bg-darkgray bg-white`}
    >
      <DotLottieReact
        data-tauri-drag-region
        loop={true}
        autoplay={true}
        src="/animations/rocket.lottie"
        className="w-60 h-60"
        segment={[45, 110]}
        speed={0.5}
      />

      <div
        data-tauri-drag-region
        className="flex flex-col items-center justify-center space-y-3 w-full"
      >
        <p
          data-tauri-drag-region
          className={`font-Readex font-bold dark:text-white text-black select-none`}
        >
          {isUpdateState === "Checking"
            ? t("checking_for_updates")
            : isUpdateState === "Available"
              ? t("updates_downloading")
              : isUpdateState === "Downloading"
                ? t("updates_downloading")
                : t("updates_downloaded")}
        </p>

        {isUpdateState === "Checking" ? (
          <div
            data-tauri-drag-region
            className="flex w-full items-center justify-center"
          >
            <svg
              data-tauri-drag-region
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                data-tauri-drag-region
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                data-tauri-drag-region
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : isUpdateState === "Available" ? (
          <div
            data-tauri-drag-region
            className="flex w-full flex-col space-y-3 items-center justify-center"
          >
            <div
              data-tauri-drag-region
              className="flex w-full flex-row space-x-4 items-center justify-center"
            >
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                v{isUpdateInfo?.version}
              </p>
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                {isUpdateInfo?.releaseDate
                  ? String(
                    moment(isUpdateInfo?.releaseDate).format("DD-MM-YYYY")
                  )
                  : "Unknown"}
              </p>
            </div>

            <div
              data-tauri-drag-region
              className="w-full items-center justify-center pl-6 pr-6"
            >
              <div
                data-tauri-drag-region
                className={`relative w-full rounded-[50px] h-[8px] dark:bg-gray-400 bg-gray-300`}
              >
                <div
                  data-tauri-drag-region
                  className="absolute rounded-[50px] w-0 h-[8px] bg-blue-600"
                />
              </div>
            </div>
          </div>
        ) : isUpdateState === "Downloading" ? (
          <div
            data-tauri-drag-region
            className="flex w-full flex-col space-y-3 items-center justify-center"
          >
            <div
              data-tauri-drag-region
              className="flex w-full flex-row space-x-4 items-center justify-center"
            >
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                v{isUpdateInfo?.version}
              </p>
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                {isUpdateInfo?.releaseDate
                  ? String(
                    moment(
                      new Date(isUpdateInfo?.releaseDate).getTime()
                    ).format("DD-MM-YYYY")
                  )
                  : "Unknown"}
              </p>
            </div>

            <div
              data-tauri-drag-region
              className="w-full items-center justify-center flex flex-row space-x-6"
            >
              {/* <div className={`relative w-full rounded-[50px] h-[8px] dark:bg-gray-400 bg-gray-300`}>
                                            <div
                                                className="absolute rounded-[50px] w-0 h-[8px] bg-blue-600 duration-150"
                                                style={{
                                                    width: `${isUpdateProgress.percent}%`
                                                }}
                                            />
                                        </div> */}
              <p
                data-tauri-drag-region
                className={`font-Readex font-bolddark:text-white text-black`}
              >
                {t("downloading")}
              </p>
              <svg
                data-tauri-drag-region
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  data-tauri-drag-region
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  data-tauri-drag-region
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>
        ) : (
          <div
            data-tauri-drag-region
            className="flex w-full flex-col space-y-3 items-center justify-center"
          >
            <div
              data-tauri-drag-region
              className="flex w-full flex-row space-x-4 items-center justify-center"
            >
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                v{isUpdateInfo?.version}
              </p>
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                {isUpdateInfo?.releaseDate
                  ? String(
                    moment(
                      new Date(isUpdateInfo?.releaseDate).getTime()
                    ).format("DD-MM-YYYY")
                  )
                  : "Unknown"}
              </p>
            </div>

            <div
              data-tauri-drag-region
              className="w-full flex flex-row space-x-4 items-center justify-center"
            >
              <p
                data-tauri-drag-region
                className={`font-Readex dark:text-white text-black`}
              >
                {t("finalizing")}
              </p>
              <svg
                data-tauri-drag-region
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  data-tauri-drag-region
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  data-tauri-drag-region
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Update;
