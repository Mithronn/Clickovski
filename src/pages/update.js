import React from 'react'
import Head from "next/head";
import moment from 'moment';
import { emit, listen } from '@tauri-apps/api/event'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
import { getI18n, useTranslation } from 'react-i18next'

import LottieAnimation from '../components/LottieAnimation';
import useTheme from "../components/useTheme";

import RocketAnimation from "../animations/Rocket.json";

function Update(props) {
    const { t, i18n } = useTranslation();
    const [isUpdateState, setUpdateState] = React.useState("Checking");
    const [isUpdateInfo, setUpdateInfo] = React.useState({});
    const [isUpdateProgress, setUpdateProgress] = React.useState({ percent: 0 });
    const theme = useTheme();

    React.useEffect(() => {
        // const updateDownloadingData = (event) => {
        //     setUpdateProgress(event.payload);
        // }

        // const updateDownloadedData = (event) => {
        //     setUpdateProgress((updateProgress) => {
        //         return { ...updateProgress, percent: 0 }
        //     });

        //     setUpdateInfo(event.payload);
        // }

        // const updateStateListen = listen("updateState", updateState);
        // const updateAvailableListen = listen("updateAvailable", updateAvailable);
        // const updateDownloadingDataListen = listen("updateDownloadingData", updateDownloadingData);
        // const updateDownloadedDataListen = listen("updateDownloadedData", updateDownloadedData);
        // return () => {
        //     updateStateListen.then((f) => f());
        //     updateAvailableListen.then((f) => f());
        //     updateDownloadingDataListen.then((f) => f());
        //     updateDownloadedDataListen.then((f) => f());
        // }

        (async () => {
            try {
                const { shouldUpdate, manifest } = await checkUpdate();
                if (!shouldUpdate) return window.__TAURI__.invoke("close_updater_and_open_main");
                if (shouldUpdate) {
                    setUpdateInfo({
                        releaseDate: manifest.date,
                        version: manifest.version
                    });

                    setUpdateState("Downloading");

                    //TODO: update-download-progress
                    //             listen("tauri://update-download-progress", (e) => {
                    //     e.payload
                    // })

                    await installUpdate();

                    // install complete, restart the app
                    relaunch();
                }
            } catch (error) {
                console.log(error);
                return window.__TAURI__.invoke("close_updater_and_open_main");
            }
        })();

    }, []);

    return (
        <div data-tauri-drag-region style={{ WebkitAppRegion: "drag" }} className={`w-full min-h-screen flex items-center justify-center flex-col space-y-6 ${theme ? "bg-darkgray" : "bg-white"}`}>
            <Head>
                <title>Clickovski Updater</title>
            </Head>

            <LottieAnimation data-tauri-drag-region loop="true" JSONFile={props.RocketAnimation} className="w-60 h-60" startFrame={45} stopFrame={110} speed={0.5} />

            <div data-tauri-drag-region className="flex flex-col items-center justify-center space-y-3 w-full">
                <p data-tauri-drag-region className={`font-Readex font-bold ${theme ? "text-white" : "text-black"} select-none`}>
                    {
                        isUpdateState === "Checking" ? "Checking for updates" :
                            isUpdateState === "Available" ? "Updates downloading" :
                                isUpdateState === "Downloading" ? "Updates downloading" :
                                    "Updates downloaded!"
                    }
                </p>

                {
                    isUpdateState === "Checking" ?
                        (
                            <div data-tauri-drag-region className="flex w-full items-center justify-center">
                                <svg data-tauri-drag-region className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle data-tauri-drag-region className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path data-tauri-drag-region className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )
                        :
                        isUpdateState === "Available" ?
                            (
                                <div data-tauri-drag-region className="flex w-full flex-col space-y-3 items-center justify-center">
                                    <div data-tauri-drag-region className="flex w-full flex-row space-x-4 items-center justify-center">
                                        <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>v{isUpdateInfo.version}</p>
                                        <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>{isUpdateInfo.releaseDate ? String(moment(isUpdateInfo.releaseDate).format('DD-MM-YYYY')) : "Unknown"}</p>
                                    </div>

                                    <div data-tauri-drag-region className="w-full items-center justify-center pl-6 pr-6">
                                        <div data-tauri-drag-region className={`relative w-full rounded-[50px] h-[8px] ${theme ? "bg-gray-400" : "bg-gray-300"}`}>
                                            <div
                                                data-tauri-drag-region
                                                className="absolute rounded-[50px] w-0 h-[8px] bg-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                            :
                            isUpdateState === "Downloading" ?
                                <div data-tauri-drag-region className="flex w-full flex-col space-y-3 items-center justify-center">
                                    <div data-tauri-drag-region className="flex w-full flex-row space-x-4 items-center justify-center">
                                        <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>v{isUpdateInfo.version}</p>
                                        <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>{isUpdateInfo.releaseDate ? String(moment(isUpdateInfo.releaseDate).format('DD-MM-YYYY')) : "Unknown"}</p>
                                    </div>

                                    <div data-tauri-drag-region className="w-full items-center justify-center flex flex-row space-x-6">
                                        {/* <div className={`relative w-full rounded-[50px] h-[8px] ${theme ? "bg-gray-400" : "bg-gray-300"}`}>
                                            <div
                                                className="absolute rounded-[50px] w-0 h-[8px] bg-blue-600 duration-150"
                                                style={{
                                                    width: `${isUpdateProgress.percent}%`
                                                }}
                                            />
                                        </div> */}
                                        <p data-tauri-drag-region className={`font-Readex font-bold ${theme ? "text-white" : "text-black"}`}>Downloading</p>
                                        <svg data-tauri-drag-region className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle data-tauri-drag-region className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path data-tauri-drag-region className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                </div>
                                :
                                (
                                    <div data-tauri-drag-region className="flex w-full flex-col space-y-3 items-center justify-center">
                                        <div data-tauri-drag-region className="flex w-full flex-row space-x-4 items-center justify-center">
                                            <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>v{isUpdateInfo.version}</p>
                                            <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>{isUpdateInfo.releaseDate ? String(moment(isUpdateInfo.releaseDate).format('DD-MM-YYYY')) : "Unknown"}</p>
                                        </div>

                                        <div data-tauri-drag-region className="w-full flex flex-row space-x-4 items-center justify-center">
                                            <p data-tauri-drag-region className={`font-Readex ${theme ? "text-white" : "text-black"}`}>Finalizing</p>
                                            <svg data-tauri-drag-region className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle data-tauri-drag-region className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path data-tauri-drag-region className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                )
                }
            </div>
        </div>
    )
}

export const getStaticProps = async () => {
    return {
        props: {
            RocketAnimation
        }
    }
}

export default Update