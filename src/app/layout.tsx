/* eslint-disable @next/next/no-head-element */
"use client"
import '../styles/globals.css';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion'

import Providers from "./Providers";
import SafeHydrate from "./SafeHydrate";
import EmotionRootStyleRegistry from "./emotion";
import Launcher from "./Launcher";

export default function RootLayout({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const childrenWithProps = React.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a
    // typescript error too.
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { key: pathname });
    }
    return child;
  });
  return (
    <html>
      <head></head>
      <body>
        {/* <SafeHydrate> */}
        <Providers {...props}>
          <EmotionRootStyleRegistry>
            <div className="w-full min-h-screen overflow-hidden">
              <AnimatePresence
                mode="wait"
                initial={false}
                onExitComplete={() => window.scrollTo(0, 0)}
              >
                <div key={pathname} className="overflow-hidden">
                  {childrenWithProps}
                </div>
              </AnimatePresence>
              <Launcher key="LAUNCHER" />
            </div>
          </EmotionRootStyleRegistry>
        </Providers>
        {/* </SafeHydrate> */}
      </body>
    </html>
  );
}
