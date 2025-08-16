/* eslint-disable @next/next/no-head-element */

import "@/styles/globals.css";

import React from "react";
import { Metadata } from "next";

import Launcher from "@/components/Launcher";
import FramerAnimatePresence from "@/components/FramerAnimatePresence";
import Providers from "../components/Providers";
import SafeHydrate from "../components/SafeHydrate";
import Script from "next/script";


export const metadata: Metadata = {
  title: `Clickovski`,
  description: `Clickovski`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <Script>
          {`
            if (localStorage.getItem("darkMode") === "true") {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `}
        </Script>
      </head>
      <body>
        <SafeHydrate>
          <Providers>
            <div className="w-full min-h-screen overflow-hidden">
              <FramerAnimatePresence>
                {children}
              </FramerAnimatePresence>
              <Launcher key="LAUNCHER" />
            </div>
          </Providers>
        </SafeHydrate>
      </body>
    </html>
  );
}
