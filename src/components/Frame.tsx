import React from 'react'
import { useRouter } from 'next/router'
const { motion, AnimatePresence } = require('framer-motion');
import { useDispatch, useSelector } from 'react-redux'

import { MinimizeIcon, CloseIcon } from "../components/icons";
import useTheme from "../components/useTheme.js";

function Frame() {
    const router = useRouter();
    const reduxState = useSelector((state: any) => state);
    const theme = useTheme(reduxState);
    const [isAppInfo, setAppInfo] = React.useState({
        name: null,
        version: null,
        icon: null
    });

    React.useEffect(() => {
        const handleWatchAppInfo = (event, message: any) => {
            if (message) {
                setAppInfo(message);
            }
        }

        // window.electron.message.on("watchAppInfoForFrame", handleWatchAppInfo);
        // window.electron.message.send("watchAppInfoForFrame", true);

        return () => {
            // window.electron.message.off("watchAppInfoForFrame", handleWatchAppInfo);
        }
    }, []);

    const CloseAppFunction = () => {
        // window.electron.message.send("CloseAppFromRenderer", true);
    }

    const MinimizeAppFunction = () => {
        // window.electron.message.send("MinimizeAppFromRenderer", true);
    }

    if (router.pathname === "/update") {
        return null;
    }

    return (
        <div style={{ WebkitAppRegion: "drag" }} className={`absolute flex flex-row justify-between h-8 pl-2 items-center w-full top-0 left-0  ${theme ? "bg-darkestgray shadow-xl" : "bg-white shadow-md"} duration-150`}>
            {/* LOGO & MARK */}
            <div className="flex flex-row space-x-2 items-center">
                <img className="select-none focus:outline-none outline-none" src={isAppInfo.icon} />
                <p className={`text-sm font-Readex font-bold select-none ${theme ? "text-gray-200" : "text-black"} duration-150`}>{isAppInfo.name}</p>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-row">
                <button
                    style={{ WebkitAppRegion: "no-drag" }}
                    className={`p-[11px] flex items-center justify-center focus:outline-none outline-none ${theme ? "hover:bg-darkgray bg-opacity-30" : "hover:bg-gray-200"} duration-150`}
                    onClick={MinimizeAppFunction}
                >
                    <MinimizeIcon width="10" height="10" className={`${theme ? "text-gray-200" : "text-black"} duration-150`} />
                </button>
                <button
                    style={{ WebkitAppRegion: "no-drag" }}
                    className="group p-[11px] flex items-center justify-center focus:outline-none outline-none hover:bg-red-500 duration-150"
                    onClick={CloseAppFunction}
                >
                    <CloseIcon width="10" height="10" className={`${theme ? "text-gray-200" : "text-black group-hover:text-gray-200"} duration-150`} />
                </button>
            </div>
        </div>
    )
}

export default Frame