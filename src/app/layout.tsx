/* eslint-disable @next/next/no-head-element */
"use client";

import "@/styles/globals.css";

import React from "react";
import Providers from "./Providers";
import SafeHydrate from "./SafeHydrate";
import { AnimatePresence, motion } from "framer-motion";

import Launcher from "@/components/Launcher";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
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
        <SafeHydrate>
          <Providers>
            <div className="w-full min-h-screen overflow-hidden">
              <AnimatePresence
                mode="wait"
                initial={false}
                onExitComplete={() => window.scrollTo(0, 0)}
              >
                <motion.div key={pathname} className="overflow-hidden">
                  {children}
                </motion.div>
              </AnimatePresence>
              <Launcher key="LAUNCHER" />
            </div>
          </Providers>
        </SafeHydrate>
      </body>
    </html>
  );
}
