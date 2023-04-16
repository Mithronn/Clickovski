'use client';

import React from 'react'
import Lottie from "lottie-web";

function LottieAnimation({ JSONFile, className, loop, speed, startFrame, stopFrame }) {
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        if (containerRef.current) {
            const animation = Lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: loop ? true : false,
                rendererSettings: {
                    className
                },
                autoplay: true,
                animationData: JSONFile,
                initialSegment: startFrame && stopFrame && [startFrame, stopFrame]
            });

            animation.setSpeed(speed ? speed : 1);

            return () => animation.destroy();
        }
    }, [containerRef, JSONFile, className]);

    return (
        <div data-tauri-drag-region ref={containerRef} className={`${className}`} />
    );
}

export default LottieAnimation
