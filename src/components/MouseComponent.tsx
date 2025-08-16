'use client';
import React from 'react'

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface MouseComponentProps {
    theme: boolean
    activeKey: string
    isDisabled: boolean
    isRunning: boolean
    onPathClick: (key: string) => void
}


function MouseComponent({ theme, activeKey, isDisabled, onPathClick, isRunning }: MouseComponentProps) {
    return (
        <div className={`${isDisabled || isRunning ? "opacity-50" : "opacity-100"} duration-150`}>
            <svg
                version="1.1"
                width="144"
                height="144"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                viewBox="0 0 416 416"
            >
                {/* Frame */}
                <path
                    shapeRendering="geometricPrecision"
                    className={`${theme ? "stroke-[rgba(16,14,14)]" : "stroke-black"}`}
                    d="M221.5,0h-31.9C123.7,0,72.1,53.7,72.1,122.4v171.3c0,68.6,51.7,122.4,117.6,122.4h31.9c67.5,0,122.3-54.9,122.3-122.4V122.4C343.9,54.8,289.1,0,221.5,0z M206.8,64.1h2.4c3.9,0,7,3.2,7,7v49.7c0,3.9-3.2,7-7,7h-2.4c-3.9,0-7-3.2-7-7V71.2
C199.8,67.3,202.9,64.1,206.8,64.1z M327.9,293.7c0,58.7-47.7,106.4-106.3,106.4h-31.9c-57,0-101.6-46.7-101.6-106.4V122.4
C88.1,62.7,132.7,16,189.7,16h10.2c0,0,0,0,0,0v33.1c0,0,0,0,0,0c-9.3,2.9-16.1,11.7-16.1,21.9V121c0,10.3,6.8,19,16.1,21.9
c0,0,0,0,0,0v40.8c0,4.3,3.2,8,7.5,8.3c4.6,0.3,8.5-3.4,8.5-8V143c0,0,0,0,0,0c9.4-2.9,16.3-11.6,16.3-22V71.1
c0-10.4-6.9-19.1-16.3-22c0,0,0,0,0,0V16c0,0,0,0,0,0h5.6c58.8,0,106.4,47.6,106.4,106.4V293.7z"/>
                <path d="M107,195" />

                {/* Left button */}
                <Tooltip delayDuration={0} disableHoverableContent={isDisabled || isRunning}>
                    <TooltipTrigger asChild>
                        <path
                            onClick={() => { if (!isDisabled) onPathClick("Left") }}
                            className={`${!isDisabled && "cursor-pointer"} ${theme ? activeKey === "Left" ? `fill-blue-600 ${!isDisabled && "hover:fill-blue-700"}` : `fill-gray-600 ${!isDisabled && "hover:fill-gray-700"}` : activeKey === "Left" ? `fill-blue-400 ${!isDisabled && "hover:fill-blue-500"}` : `fill-gray-200 ${!isDisabled && "hover:fill-gray-300"}`} duration-150`}
                            d="M207.4,192.1c-39.8,0-79.6,0-119.3,0c0-27.7,0-55.4,0-83.1c0.9-6.5,8-54.1,50.8-79.3c25.4-15,50.6-14.5,61-13.7
c0,11,0,22.1,0,33.1c-3,1-5.2,2.4-6.5,3.4c-8.3,6.3-9.5,16.4-9.7,18.6c0,0.3,0,2.2,0,6c0,7.6,0.1,11.3,0.1,13.7
c0,5.9-0.1,23.5-0.1,30c0,1,0,3.3,0.8,6.2c0.7,2.2,1.6,4,2,4.7c0,0,0,0.1,0.1,0.1c0,0,1.2,2.1,2.7,4c1.1,1.3,4.7,4.6,10.5,7.1
c0,1.1,0.1,2.7,0.1,4.6c0.1,3.4,0.1,6,0,14.1c0,7.9,0,11.9,0,12c-0.1,1.6-0.2,4,0,7.3c0.3,5.8,1,7.2,1.7,8.1
C202.3,189.8,203.9,191.5,207.4,192.1z"/>
                    </TooltipTrigger>
                    <TooltipContent
                        side="left"
                        className="bg-darkgray dark:bg-[#e5e5e5] dark:text-black text-white p-2 font-Readex shadow text-xs"
                    >
                        <p>{"MB1"}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Right button */}
                <path d="M212.1,80.5" />
                <Tooltip delayDuration={0} disableHoverableContent={isDisabled || isRunning}>
                    <TooltipTrigger asChild>
                        <path
                            onClick={() => { if (!isDisabled) onPathClick("Right") }}
                            className={`${!isDisabled && "cursor-pointer"} ${theme ? activeKey === "Right" ? `fill-blue-600 ${!isDisabled && "hover:fill-blue-700"}` : `fill-gray-600 ${!isDisabled && "hover:fill-gray-700"}` : activeKey === "Right" ? `fill-blue-400 ${!isDisabled && "hover:fill-blue-500"}` : `fill-gray-200 ${!isDisabled && "hover:fill-gray-300"}`} duration-150`}
                            d="M208.8,192c39.7-0.1,79.4-0.1,119.2-0.2c0-26,0.1-51.9,0.1-77.9c-0.7-7.3-4.9-45.7-38.8-73.6
C258.6,15.1,224.2,15.6,216,16c0,11,0,22.1,0,33.1c2.1,0.6,6.3,2.1,10,6c5.3,5.6,6,12.1,6.1,14.1c0.5,7.3,0.4,8.9,0.3,30.6
c0,2.6,0,5.7-0.1,12c0,4.7-0.1,8.6-0.1,11.5c-0.2,2.1-1.2,8.3-6.3,13.6c-3.7,3.9-7.8,5.5-9.9,6.1c0,3.9,0,7.2,0,9.7
c0,6.9,0,7.1,0,9.3c0,4.7,0.1,5.5,0.1,9.4c0,1.4,0,3.8,0,5.6c0,3.2,0,3.7,0,5.3c0,1.5,0,1.5,0,1.9c-0.1,0.8-0.3,3.1-1.7,5
C212.4,191.3,209.8,191.8,208.8,192z"/>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        className="bg-darkgray dark:bg-[#e5e5e5] dark:text-black text-white p-2 font-Readex shadow text-xs"
                    >
                        <p>{"MB2"}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Middle button */}
                <Tooltip delayDuration={0} disableHoverableContent={isDisabled || isRunning}>
                    <TooltipTrigger asChild>
                        <path
                            onClick={() => { if (!isDisabled) onPathClick("Middle") }}
                            className={`${!isDisabled && /*"cursor-not-allowed"*/ "cursor-pointer"} ${theme ? activeKey === "Middle" ? `fill-blue-600 ${!isDisabled && "hover:fill-blue-700"}` : `fill-gray-600 ${!isDisabled && "hover:fill-gray-700"}` : activeKey === "Middle" ? `fill-blue-400 ${!isDisabled && "hover:fill-blue-500"}` : `fill-gray-200 ${!isDisabled && "hover:fill-gray-300"}`} duration-150`}
                            d="M216.8,72.7v46.7c0,0.2-0.1,5.5-4.3,7.8c-1.7,0.9-3.4,0.9-4.3,0.8h0c-0.6,0.1-3.4,0.2-5.8-1.8
c-3.1-2.6-2.8-6.4-2.8-6.8V72.7c0-0.4-0.4-3.9,2.3-6.5c2.6-2.4,5.8-2.1,6.3-2.1h0c0.5-0.1,3.7-0.4,6.2,2.1
C217.2,68.8,216.8,72.3,216.8,72.7z"/>

                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="bg-darkgray dark:bg-[#e5e5e5] dark:text-black text-white p-2 font-Readex shadow text-xs"
                    >
                        <p>{"MB3"}</p>
                    </TooltipContent>
                </Tooltip>
            </svg>
        </div>
    )
}

export default MouseComponent